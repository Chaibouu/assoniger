/**
 * Résolution de session côté serveur, sans appel HTTP interne.
 *
 * Utilisé par le middleware (runtime Node.js), `getUser()`, les Server Actions et les
 * routes API : la logique est la même partout et ne dépend pas de NEXT_PUBLIC_APP_URL
 * (ni de la protection des previews Vercel).
 */

import crypto from "crypto";
import { db } from "@/lib/db";
import { createEncryptedJWT, getFullTokenPayload } from "@/lib/tokens";
import { getUserById } from "@/data/user";
import appConfig from "@/settings";

/** Durée de vie d'un access token (secondes), cohérente avec le login. */
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

/** SHA-256 du refresh token : seul ce hash est stocké en base. */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Ouvre une session pour un utilisateur déjà authentifié (connexion Google) :
 * access token lié à la session (`sid`) + refresh token stocké haché.
 */
export async function issueUserSession(
  user: { id: string; email: string | null },
  rememberMe: boolean
): Promise<{ accessToken: string; refreshToken: string }> {
  if (!appConfig.allowMultipleSessions) {
    await db.session.deleteMany({ where: { userId: user.id } });
  }

  const sessionId = crypto.randomUUID();
  const accessToken = createEncryptedJWT({ userId: user.id, email: user.email, sid: sessionId }, "1h");
  const refreshToken = crypto.randomBytes(64).toString("hex");

  await db.session.create({
    data: {
      id: sessionId,
      userId: user.id,
      sessionToken: accessToken,
      refreshToken: hashRefreshToken(refreshToken),
      expires: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000),
      refreshTokenExpires: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000),
      lastActivity: new Date(),
      isImpersonation: false,
      impersonatedBy: null,
    },
  });

  return { accessToken, refreshToken };
}

export type RefreshResult =
  | {
      accessToken: string;
      accessTokenExpiresAt: number;
      /** Présent si le refresh token a été renouvelé : à poser en cookie à la place de l'ancien */
      refreshToken?: string;
      /** Durée de vie restante du nouveau refresh token (secondes) — l'échéance d'origine est conservée */
      refreshTokenMaxAge?: number;
    }
  | { error: string; status: number };

/** Délai pendant lequel l'ancien refresh token reste accepté après une rotation (requêtes parallèles) */
const ROTATION_GRACE_MS = 30_000;

/**
 * Émet un nouvel access token à partir d'un refresh token valide.
 *
 * Avec `rotate` (uniquement là où le nouveau cookie peut être posé) : le refresh token est
 * renouvelé à chaque usage. L'ancien reste accepté 30 s (requêtes simultanées du navigateur) ;
 * réutilisé au-delà, c'est le signe d'un vol : la session est révoquée.
 */
export async function refreshSession(
  refreshToken: string,
  { rotate = false }: { rotate?: boolean } = {}
): Promise<RefreshResult> {
  if (!refreshToken) {
    return { error: "Token de rafraîchissement manquant", status: 400 };
  }

  const hashed = hashRefreshToken(refreshToken);
  const include = { user: { select: { isActive: true, isDeleted: true } } };
  let session = await db.session.findUnique({ where: { refreshToken: hashed }, include });
  let presentedPreviousToken = false;

  if (!session) {
    const rotated = await db.session.findFirst({ where: { previousRefreshToken: hashed }, include });
    if (rotated) {
      const rotatedAt = rotated.refreshTokenRotatedAt?.getTime() ?? 0;
      if (Date.now() - rotatedAt > ROTATION_GRACE_MS) {
        // Ancien token réutilisé après rotation : vol probable, la session est révoquée
        await db.session.delete({ where: { id: rotated.id } }).catch(() => {});
        console.warn("[session] refresh token réutilisé après rotation : session révoquée", {
          sessionId: rotated.id,
          userId: rotated.userId,
        });
        return { error: "Session révoquée", status: 403 };
      }
      session = rotated;
      presentedPreviousToken = true;
    }
  }

  if (
    !session ||
    session.isDeleted ||
    session.isImpersonation ||
    new Date() > session.refreshTokenExpires
  ) {
    return { error: "Token de rafraîchissement expiré ou introuvable", status: 403 };
  }

  // Compte désactivé ou supprimé : la session est révoquée
  if (!session.user.isActive || session.user.isDeleted) {
    await db.session.delete({ where: { id: session.id } });
    return { error: "Compte désactivé", status: 403 };
  }

  // Nouveau token d'accès lié à la session (permet la révocation)
  const accessToken = createEncryptedJWT({ userId: session.userId, sid: session.id }, "1h");
  const accessData = {
    sessionToken: accessToken,
    expires: new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000),
    lastActivity: new Date(),
  };

  // Pas de rotation demandée, ou requête parallèle arrivée avec l'ancien token pendant le délai de
  // grâce (le navigateur reçoit le nouveau via la requête qui a fait la rotation)
  if (!rotate || presentedPreviousToken) {
    await db.session.update({ where: { id: session.id }, data: accessData });
    return { accessToken, accessTokenExpiresAt: ACCESS_TOKEN_TTL_SECONDS };
  }

  const newRefreshToken = crypto.randomBytes(64).toString("hex");
  await db.session.update({
    where: { id: session.id },
    data: {
      ...accessData,
      refreshToken: hashRefreshToken(newRefreshToken),
      previousRefreshToken: hashed,
      refreshTokenRotatedAt: new Date(),
    },
  });

  return {
    accessToken,
    accessTokenExpiresAt: ACCESS_TOKEN_TTL_SECONDS,
    refreshToken: newRefreshToken,
    refreshTokenMaxAge: Math.max(
      0,
      Math.floor((session.refreshTokenExpires.getTime() - Date.now()) / 1000)
    ),
  };
}

export type SessionUserInfo =
  | {
      user: NonNullable<Awaited<ReturnType<typeof getUserById>>>;
      isImpersonation?: true;
      impersonatedBy?: string;
    }
  | { error: string };

/** Mêmes champs que `getUserById` (data/user.ts). */
const SESSION_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  image: true,
} as const;

/**
 * Utilisateur associé à un access token (session ou impersonation).
 * Une seule requête : la session (non révoquée, non expirée, compte actif) et l'utilisateur ensemble
 * — la base est distante, chaque aller-retour compte à chaque page.
 */
export async function getUserInfoFromToken(token: string): Promise<SessionUserInfo> {
  const payload = getFullTokenPayload(token);
  if (!payload?.userId || !payload.sid) {
    return { error: "Token invalide ou expiré" };
  }

  const session = await db.session.findFirst({
    where: {
      id: payload.sid,
      userId: payload.userId,
      isDeleted: false,
      refreshTokenExpires: { gt: new Date() },
      user: { isActive: true, isDeleted: false },
    },
    select: { user: { select: SESSION_USER_SELECT } },
  });
  if (!session) {
    return { error: "Token invalide ou expiré" };
  }
  const { user } = session;

  return {
    user,
    ...(payload.isImpersonation && {
      isImpersonation: true as const,
      impersonatedBy: payload.impersonatedBy,
    }),
  };
}

export type SessionTokens = {
  accessToken?: string;
  refreshToken?: string;
  impersonationToken?: string;
};

/**
 * Identité de la requête à partir de ses cookies :
 * impersonation d'abord, puis access token, puis rafraîchissement via le refresh token.
 * `tokenInfo` est présent quand un nouvel access token doit être posé en cookie.
 */
export async function resolveSessionUser(
  { accessToken, refreshToken, impersonationToken }: SessionTokens,
  /** Seul l'appelant capable de poser les cookies (middleware) active la rotation du refresh token */
  { rotateRefreshToken = false }: { rotateRefreshToken?: boolean } = {}
) {
  try {
    // ─── Impersonation active ───────────────────────────────────────────────
    // La session admin normale reste intacte dans "accessToken".
    if (impersonationToken) {
      const userData = await getUserInfoFromToken(impersonationToken);
      if (!("error" in userData)) {
        return { user: userData, isImpersonation: true as const };
      }
      // Token expiré ou invalide → on continue (la bannière disparaîtra)
    }

    // ─── Session normale ────────────────────────────────────────────────────
    if (!refreshToken) {
      return { error: "Token de rafraîchissement manquant" };
    }

    if (accessToken) {
      const userData = await getUserInfoFromToken(accessToken);
      if (!("error" in userData)) {
        return { user: userData };
      }
      // Token refusé (expiré, révoqué ou ancien format) → rafraîchissement ci-dessous
    }

    const refreshed = await refreshSession(refreshToken, { rotate: rotateRefreshToken });
    if ("error" in refreshed) {
      return { error: refreshed.error };
    }

    const userData = await getUserInfoFromToken(refreshed.accessToken);
    if ("error" in userData) {
      return { error: userData.error };
    }

    return {
      user: userData,
      tokenInfo: {
        accessToken: refreshed.accessToken,
        expiresAt: refreshed.accessTokenExpiresAt,
        ...(refreshed.refreshToken && {
          refreshToken: refreshed.refreshToken,
          refreshTokenMaxAge: refreshed.refreshTokenMaxAge ?? 0,
        }),
      },
    };
  } catch (error) {
    console.error("Erreur lors de la résolution de session :", error);
    return { error: "Erreur serveur" };
  }
}
