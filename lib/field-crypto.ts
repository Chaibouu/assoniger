/**
 * Chiffrement de champs sensibles en base (AES-256-GCM, clé AES_SECRET_KEY en hex, 32 octets).
 *
 * Format stocké : "enc:v1:<iv>.<tag>.<données>" (base64). Une valeur sans ce préfixe est une
 * ancienne valeur en clair : elle est lue telle quelle (migration progressive, voir
 * scripts/encrypt-bank-accounts.ts).
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

function key(): Buffer {
  const k = Buffer.from(process.env.AES_SECRET_KEY ?? "", "hex");
  if (k.length !== 32) {
    throw new Error("AES_SECRET_KEY doit contenir 32 octets en hexadécimal (64 caractères)");
  }
  return k;
}

export function isEncryptedField(value: string): boolean {
  return value.startsWith(PREFIX);
}

/** Chiffre une valeur (null / vide / déjà chiffrée : inchangée). */
export function encryptField<T extends string | null | undefined>(value: T): T {
  if (typeof value !== "string" || value === "" || isEncryptedField(value)) return value;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}.${tag.toString("base64")}.${data.toString("base64")}` as T;
}

/** Déchiffre une valeur chiffrée ; une ancienne valeur en clair est renvoyée telle quelle. */
export function decryptField<T extends string | null | undefined>(value: T): T {
  if (typeof value !== "string" || !isEncryptedField(value)) return value;
  try {
    const [iv, tag, data] = value.slice(PREFIX.length).split(".");
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8") as T;
  } catch (error) {
    // Clé changée ou donnée altérée : ne jamais renvoyer le texte chiffré à l'interface
    console.error("[field-crypto] déchiffrement impossible :", error);
    return null as T;
  }
}
