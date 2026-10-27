import os from "node:os";
import path from "node:path";
import { existsSync } from "node:fs";
import { PDFParse } from "pdf-parse";
import { createWorker, PSM } from "tesseract.js";
import {
  findArreteReference,
  hasNumberedReferenceMention,
  isArreteReferenceFoundInPdfText,
  type ArreteMatchResult,
} from "@/lib/arrete-pdf-match";
import {
  getCachedArreteDocument,
  pdfFingerprint,
  setCachedArreteDocument,
  type ArreteDocument,
} from "@/lib/arrete-pdf-cache";

export { isArreteReferenceFoundInPdfText };

/** Modèle OCR français livré avec le projet (pas de téléchargement au premier appel). */
const TESSDATA_DIR = path.join(process.cwd(), "tessdata");
const OCR_LANG = "fra";
/** Largeur de rendu de la page 1 : assez fine pour les tampons, raisonnable en temps d'OCR */
const RENDER_WIDTH = 1800;
/** Au-delà, on abandonne l'OCR (le document sera jugé sur sa seule couche texte) */
const OCR_TIMEOUT_MS = 30_000;

export async function extractPdfPlainText(data: Uint8Array): Promise<string> {
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return typeof result.text === "string" ? result.text : "";
  } finally {
    await parser.destroy?.();
  }
}

function tesseractWorkerOptions() {
  // Script exécuté DANS le worker (worker-script), et non le module côté thread principal (worker) :
  // avec le mauvais fichier, le worker ne répond jamais et l'OCR expire sans erreur.
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "tesseract.js",
    "src",
    "worker-script",
    "node",
    "index.js"
  );
  const localModel = existsSync(path.join(TESSDATA_DIR, `${OCR_LANG}.traineddata`));
  if (!localModel) {
    console.warn("[arrete-pdf-validate] tessdata/fra.traineddata introuvable : téléchargement du modèle OCR");
  }
  return {
    logger: () => {},
    errorHandler: (err: unknown) => {
      console.error("[arrete-pdf-validate] tesseract worker:", err);
    },
    ...(existsSync(workerPath) && { workerPath }),
    ...(localModel
      ? { langPath: TESSDATA_DIR, gzip: false, cacheMethod: "none" }
      : // Repli : modèle téléchargé, mis en cache dans un dossier inscriptible (serverless : /tmp)
        { cachePath: os.tmpdir() }),
  };
}

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

const arreteOcrGlobal = globalThis as typeof globalThis & {
  __arreteTesseractWorkerPromise?: Promise<TesseractWorker>;
  __arreteOcrChain?: Promise<unknown>;
  __arreteAnalysisInFlight?: Map<string, Promise<ArreteDocument>>;
};

function arreteOcrEnqueue<T>(task: () => Promise<T>): Promise<T> {
  const prev = arreteOcrGlobal.__arreteOcrChain ?? Promise.resolve();
  const run = prev.then(task, task);
  arreteOcrGlobal.__arreteOcrChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

/**
 * Un seul worker Tesseract réutilisé entre requêtes (création + chargement du modèle ≈ 1 à 2 s).
 * Les jobs OCR sont sérialisés pour éviter deux `recognize` en parallèle sur le même worker.
 */
async function withSharedTesseractWorker<T>(fn: (worker: TesseractWorker) => Promise<T>): Promise<T> {
  return arreteOcrEnqueue(async () => {
    if (!arreteOcrGlobal.__arreteTesseractWorkerPromise) {
      arreteOcrGlobal.__arreteTesseractWorkerPromise = createWorker(
        OCR_LANG,
        1,
        tesseractWorkerOptions() as Parameters<typeof createWorker>[2]
      ).catch((err) => {
        arreteOcrGlobal.__arreteTesseractWorkerPromise = undefined;
        throw err;
      });
    }
    const worker = await arreteOcrGlobal.__arreteTesseractWorkerPromise;
    return fn(worker);
  });
}

async function runOcrOnPng(
  worker: TesseractWorker,
  png: Uint8Array,
  opts: { rectangle?: { top: number; left: number; width: number; height: number }; psm: PSM }
): Promise<string> {
  await worker.setParameters({ tessedit_pageseg_mode: opts.psm, preserve_interword_spaces: "1" });
  const { data } = await worker.recognize(Buffer.from(png), opts.rectangle ? { rectangle: opts.rectangle } : {});
  return typeof data.text === "string" ? data.text : "";
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

/**
 * OCR de la page 1 : d'abord l'en-tête (où figure en général « Arrêté n° … »), puis la page
 * entière seulement si l'en-tête ne contient pas de mention numérotée.
 */
async function ocrFirstPage(parser: PDFParse): Promise<string> {
  let screenshot;
  try {
    screenshot = await parser.getScreenshot({ partial: [1], desiredWidth: RENDER_WIDTH });
  } catch (e) {
    console.warn("[arrete-pdf-validate] rendu de la page 1 impossible", e);
    return "";
  }

  const page = screenshot.pages?.[0];
  const png = page?.data;
  const width = page?.width ?? 0;
  const height = page?.height ?? 0;
  if (!png || png.length === 0 || width <= 0 || height <= 0) return "";

  return withSharedTesseractWorker(async (worker) => {
    const header = await runOcrOnPng(worker, png, {
      rectangle: { top: 0, left: 0, width, height: Math.max(120, Math.floor(height * 0.4)) },
      psm: PSM.AUTO,
    });
    if (hasNumberedReferenceMention(header)) return header;
    const fullPage = await runOcrOnPng(worker, png, { psm: PSM.AUTO });
    return `${header}\n${fullPage}`;
  });
}

/** Couche texte + OCR (seulement si la couche texte ne contient pas déjà le numéro d'acte). */
async function analyzePdf(data: Uint8Array): Promise<ArreteDocument> {
  const parser = new PDFParse({ data });
  try {
    const textResult = await parser.getText();
    const textLayer = typeof textResult.text === "string" ? textResult.text : "";

    if (hasNumberedReferenceMention(textLayer)) {
      return { textLayer, ocrText: "" };
    }

    let ocrText = "";
    try {
      ocrText = await withTimeout(ocrFirstPage(parser), OCR_TIMEOUT_MS, "");
    } catch (e) {
      console.error("[arrete-pdf-validate] OCR indisponible :", e);
    }
    return { textLayer, ocrText };
  } finally {
    await parser.destroy?.();
  }
}

/**
 * Document analysé (depuis le cache, ou analyse unique). Deux requêtes simultanées pour le même
 * PDF (pré-analyse + vérification) partagent la même analyse.
 */
async function getArreteDocument(id: string, data: Uint8Array): Promise<ArreteDocument> {
  const cached = await getCachedArreteDocument(id);
  if (cached) return cached;

  const inFlight = (arreteOcrGlobal.__arreteAnalysisInFlight ??= new Map());
  const pending = inFlight.get(id);
  if (pending) return pending;

  const analysis = analyzePdf(data)
    .then(async (doc) => {
      await setCachedArreteDocument(id, doc);
      return doc;
    })
    .finally(() => inFlight.delete(id));
  inFlight.set(id, analysis);
  return analysis;
}

/** Pré-analyse dès la sélection du fichier : renvoie l'identifiant à réutiliser pour les vérifications. */
export async function prepareArretePdf(data: Uint8Array): Promise<{ fileId: string; hasText: boolean }> {
  const fileId = pdfFingerprint(data);
  const doc = await getArreteDocument(fileId, data);
  return { fileId, hasText: Boolean(doc.textLayer.trim() || doc.ocrText.trim()) };
}

export type ArreteVerification =
  | { status: "expired" }
  | (ArreteMatchResult & { fileId: string; hasText: boolean });

/**
 * Vérifie la référence dans le PDF : par octets (analyse si besoin) ou par identifiant d'un PDF
 * déjà analysé (`expired` si le cache ne le contient plus : le client doit renvoyer le fichier).
 */
export async function verifyArreteReference(input: {
  reference: string;
  data?: Uint8Array;
  fileId?: string;
}): Promise<ArreteVerification> {
  let fileId: string;
  let doc: ArreteDocument | null;
  if (input.data) {
    fileId = pdfFingerprint(input.data);
    doc = await getArreteDocument(fileId, input.data);
  } else if (input.fileId) {
    fileId = input.fileId;
    doc = await getCachedArreteDocument(fileId);
  } else {
    return { status: "expired" };
  }
  if (!doc) return { status: "expired" };

  const hasText = Boolean(doc.textLayer.trim() || doc.ocrText.trim());
  const fromText = findArreteReference(input.reference, doc.textLayer);
  if (fromText.status === "found") return { ...fromText, fileId, hasText };
  const fromOcr = findArreteReference(input.reference, doc.ocrText);
  if (fromOcr.status === "found") return { ...fromOcr, fileId, hasText };

  const near = [fromText, fromOcr].find((r) => r.status === "near");
  return { ...(near ?? { status: "not_found" as const }), fileId, hasText };
}
