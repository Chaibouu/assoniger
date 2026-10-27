/**
 * Stockage des fichiers sur Cloudflare R2 (API compatible S3).
 *
 * Les clés d'objet reprennent le chemin public sans le slash initial :
 *   URL `/uploads/associations/{id}/documents/{uuid}.pdf`
 *   → clé `uploads/associations/{id}/documents/{uuid}.pdf`
 * Les URL stockées en base ne changent donc pas ; la lecture passe toujours par
 * `app/uploads/[...path]/route.ts`, qui applique le contrôle d'accès.
 *
 * Config .env :
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */

import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

declare global {
  // eslint-disable-next-line no-var
  var __r2: S3Client | undefined;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

function getClient(): S3Client {
  if (!globalThis.__r2) {
    globalThis.__r2 = new S3Client({
      region: "auto",
      endpoint: `https://${requireEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
      },
    });
  }
  return globalThis.__r2;
}

function bucket(): string {
  return requireEnv("R2_BUCKET");
}

/** Envoie un objet dans le bucket. */
export async function putObject(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/** Lit un objet. Retourne null s'il n'existe pas. */
export async function getObject(key: string): Promise<Uint8Array | null> {
  try {
    const res = await getClient().send(
      new GetObjectCommand({ Bucket: bucket(), Key: key })
    );
    if (!res.Body) return null;
    return await res.Body.transformToByteArray();
  } catch (error) {
    if (error instanceof NoSuchKey) return null;
    throw error;
  }
}

/** Supprime un objet (sans erreur s'il n'existe pas). */
export async function deleteObject(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
