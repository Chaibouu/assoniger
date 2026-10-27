/**
 * Cache du texte extrait des arrêtés (couche texte + OCR), indexé par l'empreinte SHA-256 du PDF.
 *
 * Le PDF est analysé une seule fois, dès sa sélection : les vérifications suivantes du numéro
 * (à chaque frappe) et la soumission finale réutilisent ce texte sans relancer l'OCR.
 * Mémoire de l'instance + Redis si REDIS_URL est configuré (partagé entre instances serverless).
 */

import { createHash } from "node:crypto";

export type ArreteDocument = {
  /** Couche texte du PDF (vide pour un scan) */
  textLayer: string;
  /** Texte reconnu par OCR sur la page 1 (vide si inutile ou indisponible) */
  ocrText: string;
};

const TTL_SECONDS = 60 * 60;
const MEMORY_MAX_ENTRIES = 50;
/** Garde-fou de taille pour Redis (le numéro est en page 1, le reste est superflu) */
const MAX_STORED_CHARS = 200_000;

const memory = new Map<string, { doc: ArreteDocument; expiresAt: number }>();

export function pdfFingerprint(data: Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

export function isPdfFingerprint(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function redisKey(id: string) {
  return `arrete-doc:${id}`;
}

/** Redis uniquement s'il est configuré : sinon ioredis tenterait localhost et ajouterait des secondes d'attente. */
async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  try {
    const { redis } = await import("./redis");
    return redis;
  } catch {
    return null;
  }
}

export async function getCachedArreteDocument(id: string): Promise<ArreteDocument | null> {
  const hit = memory.get(id);
  if (hit && hit.expiresAt > Date.now()) return hit.doc;
  if (hit) memory.delete(id);

  const redis = await getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(redisKey(id));
    if (!raw) return null;
    const doc = JSON.parse(raw) as ArreteDocument;
    rememberInMemory(id, doc);
    return doc;
  } catch {
    return null;
  }
}

function rememberInMemory(id: string, doc: ArreteDocument) {
  if (memory.size >= MEMORY_MAX_ENTRIES) {
    const oldest = memory.keys().next().value;
    if (oldest) memory.delete(oldest);
  }
  memory.set(id, { doc, expiresAt: Date.now() + TTL_SECONDS * 1000 });
}

export async function setCachedArreteDocument(id: string, doc: ArreteDocument): Promise<void> {
  const stored: ArreteDocument = {
    textLayer: doc.textLayer.slice(0, MAX_STORED_CHARS),
    ocrText: doc.ocrText.slice(0, MAX_STORED_CHARS),
  };
  rememberInMemory(id, stored);

  const redis = await getRedis();
  if (!redis) return;
  try {
    await redis.set(redisKey(id), JSON.stringify(stored), "EX", TTL_SECONDS);
  } catch {
    // Redis indisponible : le cache mémoire suffit sur cette instance
  }
}
