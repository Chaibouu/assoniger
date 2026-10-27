/**
 * Chemins d’upload : `uploads/...`, stockés sur Cloudflare R2 (voir `lib/storage.ts`).
 * Les fichiers sont exposés via {@see app/uploads/[...path]/route.ts}.
 */

import { posix } from "path";

const UPLOADS_ROOT_NAME = "uploads";

/** Dossier des fichiers envoyés via `/api/upload` par un utilisateur (hors association). */
export function userUploadRelative(userId: string): string {
  return `${UPLOADS_ROOT_NAME}/users/${userId}`;
}

/**
 * Normalise la destination passée à `uploadFile` : tout est rangé sous `uploads/`.
 * Pour les associations, utiliser `lib/association-upload-paths.ts` (`…/{id}/registration`, `…/{id}/documents`).
 * Accepte encore les anciennes valeurs `public/uploads` ou tout chemin relatif sûr sous `uploads/`.
 */
export function normalizeUploadDestination(destination: string): string {
  let d = destination.trim().replace(/^[/\\]+/, "").replace(/\\/g, "/");
  if (d.toLowerCase().startsWith("public/")) {
    d = d.slice("public/".length);
  }
  if (!d) {
    d = UPLOADS_ROOT_NAME;
  }
  if (d.includes("..") || d.includes("\0")) {
    throw new Error("Chemin de destination invalide");
  }
  return d;
}

/** Chemin URL public (commence par /uploads/...) pour stockage en base. */
export function toPublicUploadUrl(normalizedRelativeDir: string, filename: string): string {
  const base = normalizedRelativeDir.replace(/^\/+/, "");
  return `/${base}/${filename}`.replace(/\/{2,}/g, "/");
}

/**
 * Convertit une URL `/uploads/...` en clé d’objet R2 (`uploads/...`).
 * Retourne null si path traversal ou hors de `uploads/`.
 */
export function toUploadStorageKey(publicUrlPath: string): string | null {
  const trimmed = publicUrlPath.trim().replace(/\\/g, "/").replace(/^\/+/, "");
  if (trimmed.includes("\0") || trimmed.split("/").includes("..")) {
    return null;
  }
  const key = posix.normalize(trimmed);
  if (!key.startsWith(`${UPLOADS_ROOT_NAME}/`) || key.endsWith("/")) {
    return null;
  }
  return key;
}
