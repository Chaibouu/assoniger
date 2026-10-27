/**
 * Transmission de la session déjà résolue par le middleware aux Server Components / Server Actions
 * de la même requête, pour ne pas réinterroger la base (session + utilisateur) une seconde fois.
 *
 * Sécurité : le middleware supprime toujours cet en-tête des requêtes entrantes, et sa valeur est
 * signée (HMAC-SHA256, clé AES_SECRET_KEY) et datée : une valeur forgée ou rejouée est ignorée et
 * `getUser()` revient alors à la résolution normale par cookies.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_HEADER = "x-assoniger-session";
/** Durée de validité : le temps d'une requête (rendu + actions), pas davantage */
const MAX_AGE_MS = 60_000;

function secret(): string {
  return process.env.AES_SECRET_KEY ?? "";
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function encodeSessionHeader(value: unknown): string | null {
  if (!secret()) return null;
  const body = Buffer.from(JSON.stringify({ v: value, t: Date.now() })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSessionHeader<T>(header: string | null): T | null {
  if (!header || !secret()) return null;
  const [body, signature] = header.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const { v, t } = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { v: T; t: number };
    if (typeof t !== "number" || Date.now() - t > MAX_AGE_MS || t > Date.now() + 5_000) return null;
    return v;
  } catch {
    return null;
  }
}
