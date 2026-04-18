import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUser } from "./actions/getUser";
import { applyRateLimit } from "./lib/rateLimit";
import { isRouteProtected } from "./utils/is-route-protected";

// ─── CSP Nonce ────────────────────────────────────────────────────────────────
/**
 * Génère un nonce cryptographiquement aléatoire par requête.
 * Le nonce est transmis :
 *   - En header de requête (x-nonce) → lu par RootLayout pour les balises <Script>
 *   - En header de réponse (Content-Security-Policy) → envoyé au navigateur
 *
 * Cela permet de supprimer 'unsafe-inline' de script-src tout en
 * autorisant les scripts inline de Next.js (qui reçoivent le nonce).
 */
function buildCspWithNonce(nonce: string): string {
  const directives = [
    "default-src 'self'",
    // Next.js injecte des scripts inline avec le nonce automatiquement
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'", // unsafe-inline requis pour les styles CSS-in-JS
    "img-src 'self' data: blob: https://firebasestorage.googleapis.com",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // En développement, autoriser 'unsafe-eval' pour le HMR Next.js
    ...(process.env.NODE_ENV === "development" ? ["script-src-elem 'self' 'unsafe-inline'"] : []),
  ];
  return directives.join("; ");
}

// ─── Middleware principal ─────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  try {
    const isApiRoute      = nextUrl.pathname.startsWith("/api");
    const isApiAuthRoute  = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isPublicRoute   = publicRoutes.includes(nextUrl.pathname);
    const isAuthRoute     = authRoutes.includes(nextUrl.pathname);

    // ─── Nonce CSP — généré pour chaque requête HTML ───────────────────────
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const csp   = buildCspWithNonce(nonce);

    // ─── Rate limiting (in-memory) sur les routes d'auth ──────────────────
    if (isApiAuthRoute) {
      const rateLimitResponse = await applyRateLimit(req);
      if (rateLimitResponse) return rateLimitResponse;
      return NextResponse.next();
    }

    // ─── Routes API ────────────────────────────────────────────────────────
    if (isApiRoute) {
      if (!isPublicRoute) {
        const authorizationHeader = req.headers.get("Authorization");
        const accessToken = authorizationHeader?.split(" ")[1];
        if (!accessToken) {
          return NextResponse.json(
            { error: "Token d'accès manquant ou non valide" },
            { status: 401 }
          );
        }
      }
      return NextResponse.next();
    }

    // ─── Routes Frontend ───────────────────────────────────────────────────
    // Transmettre le nonce en header de requête pour que le RootLayout puisse le lire
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-nonce", nonce);

    const result = await getUser();

    // Rafraîchissement du token d'accès si nécessaire
    if (result?.tokenInfo) {
      const response = NextResponse.next({ request: { headers: requestHeaders } });
      response.cookies.set({
        name: "accessToken",
        value: result.tokenInfo.accessToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: result.tokenInfo.expiresAt,
        path: "/",
        sameSite: "lax",
      });
      response.headers.set("Content-Security-Policy", csp);
      response.headers.set("x-nonce", nonce);
      return response;
    }

    const isLoggedIn  = !!result?.user && !result.error;
    const userRole    = result?.user?.user?.role;
    const protectedRoute = isRouteProtected(userRole, nextUrl.pathname);

    if (isLoggedIn && protectedRoute) {
      return NextResponse.redirect(new URL("/unauthorized", nextUrl));
    }

    if (isAuthRoute && isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }

    if (!isPublicRoute && !isAuthRoute && !isLoggedIn) {
      const callbackUrl = nextUrl.search
        ? `${nextUrl.pathname}${nextUrl.search}`
        : nextUrl.pathname;
      return NextResponse.redirect(
        new URL(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, nextUrl)
      );
    }

    // Injecter x-nonce dans la requête transmise à l'app
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("x-nonce", nonce);
    return response;

  } catch (error) {
    console.error("Erreur dans le middleware:", error);
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
