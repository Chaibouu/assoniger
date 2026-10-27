/**
 * Connexion avec Google (OAuth 2.0 / OpenID Connect, flux « authorization code » + PKCE).
 *
 * Config .env : GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET.
 * URI de redirection à déclarer dans la console Google Cloud :
 *   {NEXT_PUBLIC_APP_URL}/api/auth/google/callback
 */

import crypto from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

/** Cookie httpOnly qui porte state + vérificateur PKCE entre l'aller vers Google et le retour. */
export const GOOGLE_OAUTH_COOKIE = "google_oauth";
export const GOOGLE_OAUTH_COOKIE_MAX_AGE = 10 * 60;

export type GoogleOAuthState = {
  state: string;
  verifier: string;
  rememberMe: boolean;
  callbackUrl: string;
};

export type GoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
};

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
}

function base64Url(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function googleRedirectUri(requestOrigin: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL?.trim() || requestOrigin).replace(/\/+$/, "");
  return `${base}/api/auth/google/callback`;
}

/** Seulement un chemin interne (pas de redirection vers un site externe après connexion). */
export function sanitizeCallbackUrl(value: string | null | undefined, fallback: string): string {
  const v = value ?? "";
  return v.startsWith("/") && !v.startsWith("//") && !v.includes("\\") ? v : fallback;
}

export function createGoogleAuthRequest(
  requestOrigin: string,
  options: { rememberMe: boolean; callbackUrl: string }
): { url: string; cookieValue: string } {
  const state = base64Url(crypto.randomBytes(24));
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: googleRedirectUri(requestOrigin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  const payload: GoogleOAuthState = { state, verifier, ...options };
  return {
    url: `${GOOGLE_AUTH_URL}?${params.toString()}`,
    cookieValue: Buffer.from(JSON.stringify(payload)).toString("base64url"),
  };
}

export function parseGoogleOAuthCookie(value: string | undefined): GoogleOAuthState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as GoogleOAuthState;
    return typeof parsed.state === "string" && typeof parsed.verifier === "string" ? parsed : null;
  } catch {
    return null;
  }
}

/** Échange le code contre un jeton, puis lit le profil (email vérifié par Google). */
export async function fetchGoogleProfile(
  code: string,
  verifier: string,
  requestOrigin: string
): Promise<GoogleProfile> {
  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: googleRedirectUri(requestOrigin),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) {
    throw new Error(`Échange du code Google refusé (${tokenRes.status}) : ${await tokenRes.text()}`);
  }
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  if (!access_token) throw new Error("Réponse Google sans access_token");

  const infoRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${access_token}` },
    cache: "no-store",
  });
  if (!infoRes.ok) throw new Error(`Profil Google illisible (${infoRes.status})`);
  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!info.sub || !info.email) throw new Error("Profil Google incomplet");

  return {
    sub: info.sub,
    email: info.email,
    emailVerified: info.email_verified === true,
    name: info.name,
    picture: info.picture,
  };
}
