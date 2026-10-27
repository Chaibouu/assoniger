import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  GOOGLE_OAUTH_COOKIE,
  GOOGLE_OAUTH_COOKIE_MAX_AGE,
  createGoogleAuthRequest,
  isGoogleOAuthConfigured,
  sanitizeCallbackUrl,
} from "@/lib/google-oauth";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/google?remember=1&callbackUrl=/dashboard
 * Démarre la connexion Google : state + PKCE en cookie httpOnly, puis redirection vers Google.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL("/auth/login?error=google_unavailable", origin));
  }

  const { url, cookieValue } = createGoogleAuthRequest(origin, {
    rememberMe: req.nextUrl.searchParams.get("remember") === "1",
    callbackUrl: sanitizeCallbackUrl(req.nextUrl.searchParams.get("callbackUrl"), DEFAULT_LOGIN_REDIRECT),
  });

  const response = NextResponse.redirect(url);
  response.cookies.set(GOOGLE_OAUTH_COOKIE, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // lax : le cookie doit revenir sur la redirection de Google (navigation de premier niveau)
    sameSite: "lax",
    maxAge: GOOGLE_OAUTH_COOKIE_MAX_AGE,
    path: "/api/auth/google",
  });
  return response;
}
