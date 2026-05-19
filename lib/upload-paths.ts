/**
 * Chemins d’upload à la racine du projet : `uploads/...` (hors `public/`).
 * Les fichiers sont exposés via {@see app/uploads/[...path]/route.ts}.
 */

import { resolve, relative } from "path";

const UPLOADS_ROOT_NAME = "uploads";

/** Racine disque des fichiers exposés sous l’URL `/uploads/...`. */
export function getUploadsRootDir(): string {
  return resolve(process.cwd(), UPLOADS_ROOT_NAME);
}

/**
 * Normalise la destination passée à `uploadFile` : tout est rangé sous `uploads/` à la racine.
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
 * Résout une URL `/uploads/...` vers un chemin absolu sous le dossier `uploads/` du projet.
 * Retourne null si path traversal ou hors de `uploads/`.
 */
export function resolveSafeUploadsDiskPath(publicUrlPath: string): string | null {
  const trimmed = publicUrlPath.trim().replace(/^\/+/, "");
  if (!trimmed.toLowerCase().startsWith(`${UPLOADS_ROOT_NAME}/`)) {
    return null;
  }

  const uploadsRoot = getUploadsRootDir();
  const absolutePath = resolve(process.cwd(), trimmed);
  const rel = relative(uploadsRoot, absolutePath);
  if (rel.startsWith("..") || rel.includes("..")) {
    return null;
  }
  return absolutePath;
}
