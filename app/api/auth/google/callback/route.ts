import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { createEncryptedJWT } from "@/lib/tokens";
import { ACCESS_TOKEN_TTL_SECONDS, issueUserSession } from "@/lib/session";
import {
  TWO_FACTOR_CHALLENGE_COOKIE,
  TWO_FACTOR_CHALLENGE_MAX_AGE,
  TWO_FACTOR_REMEMBER_COOKIE,
} from "@/lib/auth-cookies";
import {
  GOOGLE_OAUTH_COOKIE,
  fetchGoogleProfile,
  isGoogleOAuthConfigured,
  parseGoogleOAuthCookie,
} from "@/lib/google-oauth";
import { getClientIP } from "@/lib/geo";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const secure = process.env.NODE_ENV === "production";

/**
 * GET /api/auth/google/callback — retour de Google.
 * Connexion réservée aux comptes existants : une association s'inscrit d'abord par le formulaire
 * (son dossier passe en modération), puis peut se connecter avec le compte Google de la même adresse.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const ip = getClientIP(req);

  /** Retour à la page de connexion avec un code d'erreur affiché par le formulaire. */
  const fail = (error: string) => {
    const res = NextResponse.redirect(new URL(`/auth/login?error=${error}`, origin));
    res.cookies.delete({ name: GOOGLE_OAUTH_COOKIE, path: "/api/auth/google" });
    return res;
  };

  if (!isGoogleOAuthConfigured()) return fail("google_unavailable");

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return fail("google_cancelled"); // refus ou fenêtre fermée chez Google

  // ─── Anti-CSRF : le state renvoyé par Google doit être celui posé au départ ───
  const saved = parseGoogleOAuthCookie(req.cookies.get(GOOGLE_OAUTH_COOKIE)?.value);
  const code = params.get("code");
  if (!saved || !code || params.get("state") !== saved.state) return fail("google_expired");

  let profile;
  try {
    profile = await fetchGoogleProfile(code, saved.verifier, origin);
  } catch (error) {
    console.error("[google-oauth] échange avec Google impossible :", error);
    return fail("google_failed");
  }
  if (!profile.emailVerified) return fail("google_email_unverified");

  // ─── Compte : lien Google déjà connu, sinon même adresse email ──────────────
  const linked = await db.account.findFirst({
    where: { provider: "google", providerAccountId: profile.sub, isDeleted: false },
    select: { userId: true },
  });
  let user = linked
    ? await db.user.findFirst({ where: { id: linked.userId, isDeleted: false } })
    : await getUserByEmail(profile.email);

  if (!user) {
    await audit({
      action: "LOGIN_FAILURE",
      ipAddress: ip,
      status: "FAILURE",
      metadata: { method: "google", email: profile.email, reason: "Aucun compte pour cet email" },
    });
    return fail("google_no_account");
  }

  if (!linked) {
    // upsert : un ancien lien supprimé (isDeleted) occupe encore la contrainte unique — on le réactive
    await db.account.upsert({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: profile.sub } },
      create: { userId: user.id, type: "oidc", provider: "google", providerAccountId: profile.sub },
      update: { userId: user.id, isDeleted: false },
    });
  }

  // Google a vérifié l'adresse : même règle que la vérification d'email (seul un compte USER s'active)
  if (!user.emailVerified) {
    const activate = user.role === UserRole.USER && !user.isActive;
    user = await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date(), ...(activate && { isActive: true }) },
    });
  }

  if (!user.isActive) {
    const awaitingModeration = user.role === UserRole.ASSOCIATION || user.role === UserRole.MEMBER;
    return fail(awaitingModeration ? "account_pending" : "account_disabled");
  }

  // ─── 2FA activée : le code reste obligatoire, même via Google ───────────────
  if (user.isTwoFactorEnabled) {
    const tempToken = createEncryptedJWT({ userId: user.id, purpose: "2fa_challenge" }, "5m");
    const loginUrl = new URL("/auth/login", origin);
    loginUrl.searchParams.set("twoFactor", "1");
    loginUrl.searchParams.set("callbackUrl", saved.callbackUrl);
    const res = NextResponse.redirect(loginUrl);
    const challengeCookie = {
      httpOnly: true,
      secure,
      sameSite: "strict" as const,
      maxAge: TWO_FACTOR_CHALLENGE_MAX_AGE,
      path: "/",
    };
    res.cookies.set(TWO_FACTOR_CHALLENGE_COOKIE, tempToken, challengeCookie);
    res.cookies.set(TWO_FACTOR_REMEMBER_COOKIE, saved.rememberMe ? "1" : "0", challengeCookie);
    res.cookies.delete({ name: GOOGLE_OAUTH_COOKIE, path: "/api/auth/google" });
    return res;
  }

  // ─── Session ────────────────────────────────────────────────────────────────
  const { accessToken, refreshToken } = await issueUserSession(user, saved.rememberMe);
  await audit({
    userId: user.id,
    action: "LOGIN_SUCCESS",
    ipAddress: ip,
    status: "SUCCESS",
    metadata: { method: "google", email: user.email },
  });

  const res = NextResponse.redirect(new URL(saved.callbackUrl, origin));
  res.cookies.set("accessToken", accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    path: "/",
  });
  res.cookies.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: (saved.rememberMe ? 30 : 7) * 24 * 60 * 60,
    path: "/",
  });
  res.cookies.delete({ name: GOOGLE_OAUTH_COOKIE, path: "/api/auth/google" });
  return res;
}
