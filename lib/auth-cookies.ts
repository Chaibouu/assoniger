/**
 * Cookies de session (httpOnly) posés par les Server Actions d'authentification.
 * Module serveur interne : ce n'est PAS une Server Action, il ne peut pas être appelé
 * depuis le navigateur pour poser des cookies arbitraires.
 */

import { cookies } from "next/headers";
import { ACCESS_TOKEN_TTL_SECONDS } from "@/lib/session";

/** Challenge 2FA en attente (token temporaire de 5 min, jamais exposé au navigateur). */
export const TWO_FACTOR_CHALLENGE_COOKIE = "twoFactorChallenge";
export const TWO_FACTOR_REMEMBER_COOKIE = "twoFactorRemember";
export const TWO_FACTOR_CHALLENGE_MAX_AGE = 5 * 60;

const secure = process.env.NODE_ENV === "production";

export async function setSessionCookies(
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean
) {
  const cookieStore = await cookies();
  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure,
    maxAge: ACCESS_TOKEN_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
  });
  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure,
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
  });
}

export async function setTwoFactorChallenge(tempToken: string, rememberMe: boolean) {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    secure,
    maxAge: TWO_FACTOR_CHALLENGE_MAX_AGE,
    path: "/",
    sameSite: "strict" as const,
  };
  cookieStore.set(TWO_FACTOR_CHALLENGE_COOKIE, tempToken, options);
  cookieStore.set(TWO_FACTOR_REMEMBER_COOKIE, rememberMe ? "1" : "0", options);
}

export async function readTwoFactorChallenge() {
  const cookieStore = await cookies();
  return {
    tempToken: cookieStore.get(TWO_FACTOR_CHALLENGE_COOKIE)?.value,
    rememberMe: cookieStore.get(TWO_FACTOR_REMEMBER_COOKIE)?.value === "1",
  };
}

export async function clearTwoFactorChallenge() {
  const cookieStore = await cookies();
  cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE);
  cookieStore.delete(TWO_FACTOR_REMEMBER_COOKIE);
}
