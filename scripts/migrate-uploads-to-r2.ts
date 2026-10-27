/**
 * Envoie sur Cloudflare R2 les fichiers encore présents dans le dossier local `uploads/`.
 * Les clés reprennent le chemin relatif (`uploads/associations/...`) : les URL déjà
 * enregistrées en base (`/uploads/...`) restent valides sans modification.
 *
 * Usage : npm run storage:migrate
 * Ré-exécutable sans risque (les objets existants sont écrasés à l'identique).
 */

import { readdir, readFile } from "fs/promises";
import { join, relative, sep } from "path";
import { putObject } from "../lib/storage";

try {
  process.loadEnvFile(".env");
} catch {
  // pas de fichier .env : variables fournies par l'environnement
}

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full) : Promise.resolve([full]);
    })
  );
  return files.flat();
}

async function main() {
  const root = process.cwd();
  const files = await listFiles(join(root, "uploads"));
  console.log(`${files.length} fichier(s) à envoyer sur R2...`);

  let failed = 0;
  for (const file of files) {
    const key = relative(root, file).split(sep).join("/");
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME_BY_EXTENSION[ext] ?? "application/octet-stream";
    try {
      await putObject(key, new Uint8Array(await readFile(file)), contentType);
      console.log(`✓ ${key}`);
    } catch (error) {
      failed++;
      console.error(`✗ ${key}`, error);
    }
  }

  console.log(failed ? `Terminé avec ${failed} échec(s).` : "Migration terminée.");
  if (failed) process.exit(1);
}

main().catch((error) => {
  console.error("Erreur de migration :", error);
  process.exit(1);
});
