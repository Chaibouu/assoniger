import path from "node:path";
import { existsSync } from "node:fs";
import { PDFParse } from "pdf-parse";
import { createWorker, PSM } from "tesseract.js";
import { isArreteReferenceFoundInPdfText } from "@/lib/arrete-pdf-match";

export { isArreteReferenceFoundInPdfText };
export async function extractPdfPlainText(data: Uint8Array): Promise<string> {
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return typeof result.text === "string" ? result.text : "";
  } finally {
    await parser.destroy?.();
  }
}

function tesseractWorkerOptions(): {
  logger: () => void;
  workerPath?: string;
  errorHandler: (err: unknown) => void;
} {
  const workerPath = path.join(
    process.cwd(),
    "node_modules",
    "tesseract.js",
    "src",
    "worker",
    "node",
    "index.js"
  );
  const base = {
    logger: () => {},
    errorHandler: (err: unknown) => {
      console.error("[arrete-pdf-validate] tesseract worker:", err);
    },
  };
  if (existsSync(workerPath)) {
    return { ...base, workerPath };
  }
  console.warn("[arrete-pdf-validate] workerPath introuvable, fallback Tesseract.js par défaut");
  return base;
}

type TesseractWorker = Awaited<ReturnType<typeof createWorker>>;

const arreteOcrGlobal = globalThis as typeof globalThis & {
  __arreteTesseractWorkerPromise?: Promise<TesseractWorker>;
  __arreteOcrChain?: Promise<unknown>;
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
 * Un seul worker Tesseract réutilisé entre requêtes (création + chargement `eng` ≈ plusieurs secondes).
 * Les jobs OCR sont sérialisés pour éviter deux `recognize` en parallèle sur le même worker.
 */
async function withSharedTesseractWorker<T>(fn: (worker: TesseractWorker) => Promise<T>): Promise<T> {
  return arreteOcrEnqueue(async () => {
    if (!arreteOcrGlobal.__arreteTesseractWorkerPromise) {
      arreteOcrGlobal.__arreteTesseractWorkerPromise = createWorker("eng", 1, tesseractWorkerOptions()).catch(
        (err) => {
          arreteOcrGlobal.__arreteTesseractWorkerPromise = undefined;
          throw err;
        }
      );
    }
    const worker = await arreteOcrGlobal.__arreteTesseractWorkerPromise;
    return fn(worker);
  });
}

async function runOcrOnPng(
  worker: TesseractWorker,
  png: Uint8Array,
  opts?: { rectangle?: { top: number; left: number; width: number; height: number }; psm?: string }
): Promise<string> {
  await worker.setParameters({ tessedit_pageseg_mode: opts?.psm ?? PSM.AUTO });
  const { data } = await worker.recognize(Buffer.from(png), opts?.rectangle ? { rectangle: opts.rectangle } : {});
  return typeof data.text === "string" ? data.text : "";
}

/**
 * Texte pour comparer la référence : couche texte du PDF, puis **un seul** OCR sur le haut de la page 1
 * (là où figure en général « Arrêté n° … ») — évite un second passage Tesseract coûteux sur toute la page.
 */
export async function extractPdfTextForArreteReference(
  data: Uint8Array,
  reference: string
): Promise<string> {
  const ref = reference.trim();
  const parser = new PDFParse({ data });
  let text = "";
  try {
    const textResult = await parser.getText();
    text = typeof textResult.text === "string" ? textResult.text : "";

    if (ref.length >= 2 && isArreteReferenceFoundInPdfText(ref, text)) {
      return text;
    }

    let screenshot;
    try {
      screenshot = await parser.getScreenshot({
        partial: [1],
        /** Plus petit = rendu + OCR plus rapides ; le tampon reste lisible avec la zone en-tête seule */
        desiredWidth: 1150,
      });
    } catch (e) {
      console.warn("[arrete-pdf-validate] getScreenshot page 1 impossible", e);
      return text;
    }

    const page = screenshot.pages?.[0];
    const png = page?.data;
    if (!png || png.length === 0) {
      return text;
    }

    const w = page.width ?? 0;
    const h = page.height ?? 0;
    const headerHeight = w > 0 && h > 0 ? Math.max(96, Math.floor(h * 0.3)) : 0;

    let ocrText = "";
    try {
      ocrText = await withSharedTesseractWorker(async (worker) => {
        if (headerHeight > 0 && w > 0) {
          return runOcrOnPng(worker, png, {
            rectangle: { top: 0, left: 0, width: w, height: headerHeight },
            psm: PSM.SINGLE_BLOCK,
          });
        }
        return "";
      });
    } catch (e) {
      console.error("[arrete-pdf-validate] OCR ou worker Tesseract indisponible :", e);
      /* On continue avec le seul texte PDF : la comparaison pourra être « non valide » sans faire planter l’API */
    }

    if (ocrText.trim()) {
      text = `${text}\n\n--- OCR (page 1, en-tête) ---\n${ocrText}`;
    }
    return text;
  } finally {
    await parser.destroy?.();
  }
}
