/**
 * Utilitaires pour la gestion des uploads de fichiers
 */

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export interface UploadOptions {
  maxSize?: number; // Taille maximale en bytes
  allowedTypes?: string[]; // Types MIME autorisés
  destination?: string; // Dossier de destination
}

export interface UploadResult {
  filename: string;
  path: string;
  size: number;
  mimetype: string;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_DESTINATION = "public/uploads";

/**
 * Valide un fichier avant l'upload
 */
export function validateFile(
  file: File,
  options: UploadOptions = {}
): { valid: boolean; error?: string } {
  const maxSize =
    options.maxSize ||
    parseInt(process.env.MAX_UPLOAD_SIZE || String(DEFAULT_MAX_SIZE));

  // Vérifier la taille
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux. Taille maximale: ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Vérifier le type MIME
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    if (!options.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types autorisés: ${options.allowedTypes.join(", ")}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Upload un fichier vers le système de fichiers
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // Valider le fichier
  const validation = validateFile(file, options);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Préparer le chemin de destination
  const destination = options.destination || DEFAULT_DESTINATION;
  const uploadDir = join(process.cwd(), destination);

  // Créer le dossier s'il n'existe pas
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  // Générer un nom de fichier unique
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = file.name.split(".").pop();
  const filename = `${timestamp}-${randomString}.${extension}`;
  const filepath = join(uploadDir, filename);

  // Convertir le File en Uint8Array et l'écrire
  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);
  await writeFile(filepath, buffer);

  return {
    filename,
    path: `/${destination}/${filename}`,
    size: file.size,
    mimetype: file.type,
  };
}

/**
 * Upload depuis un FormData (pour les API routes)
 */
export async function uploadFromFormData(
  formData: FormData,
  fieldName: string = "file",
  options: UploadOptions = {}
): Promise<UploadResult> {
  const file = formData.get(fieldName) as File;

  if (!file) {
    throw new Error(`Aucun fichier trouvé dans le champ "${fieldName}"`);
  }

  return uploadFile(file, options);
}

/**
 * Supprime un fichier uploadé
 */
export async function deleteUploadedFile(filepath: string): Promise<void> {
  const { unlink } = await import("fs/promises");
  const fullPath = join(process.cwd(), filepath);

  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}
