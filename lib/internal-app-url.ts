import { headers } from "next/headers";

/**
 * Origine de l’app pour les appels HTTP internes (Server Actions → routes API).
 * Évite de poster vers une mauvaise base si NEXT_PUBLIC_APP_URL est absent ou erroné en dev.
 */
export async function getInternalAppOrigin(): Promise<string> {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (explicit) return explicit;

  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const proto =
        h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
      return `${proto}://${host}`;
    }
  } catch {
    // headers() indisponible (ex. script hors requête)
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
