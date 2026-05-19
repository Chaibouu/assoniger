import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { getFullTokenPayload } from "@/lib/tokens";
import { refreshUserToken } from "@/lib/user";

/** Extensions visibles sur le site public sans session (logos). SVG exclu (risque XSS). */
const PUBLIC_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

function extensionFromFilename(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isPublicImageFilename(filename: string): boolean {
  return PUBLIC_IMAGE_EXTENSIONS.has(extensionFromFilename(filename));
}

export type UploadSession =
  | {
      ok: true;
      userId: string;
      /** À appeler sur la réponse si un refresh cookie a eu lieu */
      applyCookies?: (res: NextResponse) => void;
    }
  | { ok: false };

/**
 * Résout une session pour `/uploads/...` : impersonation, Bearer, cookie accessToken,
 * puis rafraîchissement via refreshToken (cookie renvoyé sur la réponse si besoin).
 */
export async function resolveUploadSession(req: NextRequest): Promise<UploadSession> {
  const impersonation = req.cookies.get("impersonationToken")?.value;
  if (impersonation) {
    const p = getFullTokenPayload(impersonation);
    if (p?.userId) {
      return { ok: true, userId: p.userId };
    }
  }

  const bearer = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  let access = bearer || req.cookies.get("accessToken")?.value || null;

  if (access) {
    const p = getFullTokenPayload(access);
    if (p?.userId) {
      return { ok: true, userId: p.userId };
    }
  }

  const refresh = req.cookies.get("refreshToken")?.value;
  if (!refresh) {
    return { ok: false };
  }

  const refreshed = await refreshUserToken(refresh, req.nextUrl.origin);
  if ("error" in refreshed || !refreshed.accessToken) {
    return { ok: false };
  }

  const p = getFullTokenPayload(refreshed.accessToken);
  if (!p?.userId) {
    return { ok: false };
  }

  const maxAge = refreshed.accessTokenExpiresAt ?? 3600;

  return {
    ok: true,
    userId: p.userId,
    applyCookies: (res: NextResponse) => {
      res.cookies.set({
        name: "accessToken",
        value: refreshed.accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge,
        path: "/",
        sameSite: "lax",
      });
    },
  };
}

/**
 * true si la requête peut accéder au fichier sans session (images publiques uniquement).
 */
export function allowAnonymousAccessToFilename(filename: string): boolean {
  return isPublicImageFilename(filename);
}
