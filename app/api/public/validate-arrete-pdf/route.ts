import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIP } from "@/lib/geo";
import { rateLimitRedis } from "@/lib/rateLimit";
import {
  prepareArretePdf,
  verifyArreteReference,
  type ArreteVerification,
} from "@/lib/arrete-pdf-validate";
import { isPdfFingerprint } from "@/lib/arrete-pdf-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Analyse (texte + OCR page 1) limitée par la durée serverless. */
export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;

function toResponse(result: Exclude<ArreteVerification, { status: "expired" }>) {
  return NextResponse.json({
    fileId: result.fileId,
    valid: result.status === "found",
    status: result.status,
    ...("excerpt" in result && { excerpt: result.excerpt }),
    ...("suggestion" in result && { suggestion: result.suggestion }),
    ...(!result.hasText && { message: "Aucun texte lisible dans ce PDF" }),
  });
}

/**
 * Deux usages :
 * - multipart `file` (+ `recognitionOrder` facultatif) : analyse le PDF une seule fois et renvoie `fileId` ;
 * - JSON `{ fileId, recognitionOrder }` : vérification instantanée sur le PDF déjà analysé
 *   (410 si l'analyse n'est plus en cache : le client renvoie alors le fichier).
 */
export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const isJson = (req.headers.get("content-type") ?? "").includes("application/json");

  // Vérifications (texte en cache) : bon marché ; analyses (OCR) : coûteuses
  const limited = await rateLimitRedis(isJson ? `arrete-check:${ip}` : `arrete-pdf:${ip}`, {
    windowMs: 60_000,
    max: isJson ? 120 : 15,
  });
  if (limited) return limited;

  try {
    if (isJson) {
      const { fileId, recognitionOrder } = (await req.json()) as {
        fileId?: unknown;
        recognitionOrder?: unknown;
      };
      const reference = String(recognitionOrder ?? "").trim();
      if (!isPdfFingerprint(fileId)) {
        return NextResponse.json({ error: "Identifiant de document invalide" }, { status: 400 });
      }
      if (reference.length < 2) {
        return NextResponse.json(
          { error: "La référence d'arrêté est trop courte pour être comparée" },
          { status: 400 }
        );
      }
      const result = await verifyArreteReference({ fileId, reference });
      if (result.status === "expired") {
        return NextResponse.json({ error: "expired" }, { status: 410 });
      }
      return toResponse(result);
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const reference = String(formData.get("recognitionOrder") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fichier PDF manquant" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Le fichier doit être un PDF" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "PDF trop volumineux (10 Mo max)" }, { status: 400 });
    }

    const data = new Uint8Array(await file.arrayBuffer());
    if (!(data[0] === 0x25 && data[1] === 0x50 && data[2] === 0x44 && data[3] === 0x46)) {
      return NextResponse.json({ error: "Le fichier n'est pas un PDF valide" }, { status: 400 });
    }

    try {
      if (reference.length < 2) {
        const prepared = await prepareArretePdf(data);
        return NextResponse.json({
          fileId: prepared.fileId,
          ...(!prepared.hasText && { message: "Aucun texte lisible dans ce PDF" }),
        });
      }
      const result = await verifyArreteReference({ data, reference });
      if (result.status === "expired") {
        return NextResponse.json({ error: "Analyse impossible" }, { status: 500 });
      }
      return toResponse(result);
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
  } catch (e) {
    console.error("[validate-arrete-pdf]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
