import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIP } from "@/lib/geo";
import { rateLimitRedis } from "@/lib/rateLimit";
import { extractPdfTextForArreteReference } from "@/lib/arrete-pdf-validate";
import { isArreteReferenceFoundInPdfText } from "@/lib/arrete-pdf-match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** OCR ciblé + worker partagé : limite serverless. */
export const maxDuration = 50;

const MAX_BYTES = 10 * 1024 * 1024;
const RL_WINDOW_MS = 60_000;
const RL_MAX = 20;

/**
 * POST multipart : `file` (PDF), `recognitionOrder` (référence saisie).
 * Réponse JSON : `{ valid: boolean }` ou erreur HTTP.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const limited = await rateLimitRedis(`arrete-pdf:${ip}`, {
    windowMs: RL_WINDOW_MS,
    max: RL_MAX,
  });
  if (limited) return limited;

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const recognitionOrder = String(formData.get("recognitionOrder") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier PDF manquant" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Le fichier doit être un PDF" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "PDF trop volumineux (10 Mo max)" }, { status: 400 });
    }
    if (recognitionOrder.length < 2) {
      return NextResponse.json(
        { error: "La référence d'arrêté est trop courte pour être comparée" },
        { status: 400 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    let pdfText: string;
    try {
      pdfText = await extractPdfTextForArreteReference(buffer, recognitionOrder);
    } catch (err) {
      console.error("[validate-arrete-pdf] lecture PDF / extraction :", err);
      return NextResponse.json(
        {
          error:
            "Impossible d'analyser ce PDF (fichier corrompu, protégé, ou erreur technique). Réessayez avec un autre export PDF.",
        },
        { status: 400 }
      );
    }

    if (!pdfText.trim()) {
      return NextResponse.json(
        { valid: false, message: "Aucun texte extractible dans ce PDF" },
        { status: 200 }
      );
    }

    const valid = isArreteReferenceFoundInPdfText(recognitionOrder, pdfText);
    return NextResponse.json({ valid });
  } catch (e) {
    console.error("[validate-arrete-pdf]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
