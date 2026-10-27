import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/tokens";
import { refreshSession } from "@/lib/session";

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
    const p = await verifyAccessToken(impersonation);
    if (p?.userId) {
      return { ok: true, userId: p.userId };
    }
  }

  const bearer = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "").trim();
  let access = bearer || req.cookies.get("accessToken")?.value || null;

  if (access) {
    const p = await verifyAccessToken(access);
    if (p?.userId) {
      return { ok: true, userId: p.userId };
    }
  }

  const refresh = req.cookies.get("refreshToken")?.value;
  if (!refresh) {
    return { ok: false };
  }

  const refreshed = await refreshSession(refresh);
  if ("error" in refreshed) {
    return { ok: false };
  }

  const p = await verifyAccessToken(refreshed.accessToken);
  if (!p?.userId) {
    return { ok: false };
  }

  const maxAge = refreshed.accessTokenExpiresAt;

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
 * Extrait l'id d'association d'un segment de dossier `associations/{id}` ou legacy `associations/{slug}-{id}`.
 * Les cuid ne contiennent pas de tiret : l'id est toujours la dernière partie.
 */
function associationIdFromFolder(folder: string): string | null {
  const id = folder.split("-").pop() ?? "";
  return id ? id : null;
}

/**
 * Vérifie qu'un utilisateur authentifié a le droit de lire un fichier sous `/uploads/...`.
 * - Modération (ADMIN, SUPER_ADMIN, MODERATOR) : tous les fichiers.
 * - `associations/{id}/...` : compte titulaire de l'association.
 * - `users/{userId}/...` : l'utilisateur qui a envoyé le fichier.
 * - Tout autre chemin : modération uniquement.
 *
 * @param segments Segments décodés après `/uploads/`.
 */
export async function canUserAccessUpload(
  userId: string,
  segments: string[]
): Promise<boolean> {
  const user = await db.user.findFirst({
    where: { id: userId, isDeleted: false, isActive: true },
    select: { id: true, role: true },
  });
  if (!user) return false;

  if (
    user.role === UserRole.ADMIN ||
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.MODERATOR
  ) {
    return true;
  }

  const [scope, owner] = segments;
  if (!owner || segments.length < 3) return false;

  if (scope === "users") {
    return owner === user.id;
  }

  if (scope === "associations") {
    const associationId = associationIdFromFolder(owner);
    if (!associationId) return false;
    const association = await db.association.findFirst({
      where: { id: associationId, isDeleted: false, userId: user.id },
      select: { id: true },
    });
    return Boolean(association);
  }

  return false;
}

/**
 * true si la requête peut accéder au fichier sans session (images publiques uniquement).
 */
export function allowAnonymousAccessToFilename(filename: string): boolean {
  return isPublicImageFilename(filename);
}
