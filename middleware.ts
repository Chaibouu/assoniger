import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
  isPublicPath,
} from "@/routes";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveSessionUser } from "./lib/session";
import { SESSION_HEADER, encodeSessionHeader } from "./lib/session-header";
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
  const isDev = process.env.NODE_ENV === "development";

  // En dev, Next.js/Turbopack utilise eval() et des scripts inline pour le HMR.
  // On doit donc autoriser 'unsafe-eval' et 'unsafe-inline' (sans 'strict-dynamic'
  // ni nonce qui casseraient le HMR).
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:"
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`;

  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://firebasestorage.googleapis.com",
    "frame-src 'self' blob:",
    "worker-src 'self' blob:",
    "font-src 'self' data:",
    isDev ? "connect-src 'self' ws: wss: http: https:" : "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  return directives.join("; ");
}

// ─── Middleware principal ─────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { nextUrl } = req;

  try {
    const isApiRoute = nextUrl.pathname.startsWith("/api");
    const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
    const isApiPublicRoute = nextUrl.pathname.startsWith("/api/public");
    const isPublicRoute = isPublicPath(nextUrl.pathname);
    const isAuthRoute = authRoutes.includes(nextUrl.pathname);

    // ─── Nonce CSP — généré pour chaque requête HTML ───────────────────────
    const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
    const csp = buildCspWithNonce(nonce);

    // L'en-tête de session interne n'est jamais accepté depuis l'extérieur (toutes les branches)
    const requestHeaders = new Headers(req.headers);
    requestHeaders.delete(SESSION_HEADER);
    const passThrough = () => NextResponse.next({ request: { headers: requestHeaders } });

    // ─── Rate limiting (in-memory) sur les routes d'auth ──────────────────
    if (isApiAuthRoute) {
      const rateLimitResponse = await applyRateLimit(req);
      if (rateLimitResponse) return rateLimitResponse;
      return passThrough();
    }

    // ─── Routes API ────────────────────────────────────────────────────────
    if (isApiRoute) {
      if (!isPublicRoute && !isApiPublicRoute) {
        const authorizationHeader = req.headers.get("Authorization");
        const accessToken = authorizationHeader?.split(" ")[1];
        if (!accessToken) {
          return NextResponse.json(
            { error: "Token d'accès manquant ou non valide" },
            { status: 401 }
          );
        }
      }
      return passThrough();
    }

    // ─── Routes Frontend ───────────────────────────────────────────────────
    // Transmettre le nonce en header de requête pour que le RootLayout puisse le lire
    requestHeaders.set("x-nonce", nonce);

    // Résolution directe (base de données) : aucun appel HTTP interne vers /api/profile ou /api/auth/refresh
    const result = await resolveSessionUser(
      {
        accessToken: req.cookies.get("accessToken")?.value,
        refreshToken: req.cookies.get("refreshToken")?.value,
        impersonationToken: req.cookies.get("impersonationToken")?.value,
      },
      // Le middleware pose les cookies sur la réponse : il peut renouveler le refresh token
      { rotateRefreshToken: true }
    );

    // Tokens rafraîchis : transmis aussi aux Server Components de cette requête
    // (sinon getUser() relirait les anciens cookies et rafraîchirait une seconde fois)
    const tokenInfo = "tokenInfo" in result ? result.tokenInfo : undefined;
    if (tokenInfo) {
      req.cookies.set("accessToken", tokenInfo.accessToken);
      if (tokenInfo.refreshToken) req.cookies.set("refreshToken", tokenInfo.refreshToken);
      requestHeaders.set("cookie", req.cookies.toString());
    }

    // Session résolue transmise (signée) aux pages et actions : getUser() n'interroge plus la base
    const { tokenInfo: _refreshed, ...sessionForApp } = result as typeof result & { tokenInfo?: unknown };
    const sessionHeader = encodeSessionHeader(sessionForApp);
    if (sessionHeader) requestHeaders.set(SESSION_HEADER, sessionHeader);

    /** Pose le cookie rafraîchi sur toute réponse (y compris les redirections). */
    const withRefreshedCookie = (response: NextResponse) => {
      if (tokenInfo) {
        response.cookies.set({
          name: "accessToken",
          value: tokenInfo.accessToken,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: tokenInfo.expiresAt,
          path: "/",
          sameSite: "lax",
        });
        if (tokenInfo.refreshToken) {
          response.cookies.set({
            name: "refreshToken",
            value: tokenInfo.refreshToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: tokenInfo.refreshTokenMaxAge,
            path: "/",
            sameSite: "lax",
          });
        }
      }
      return response;
    };

    // Les contrôles de rôle s'appliquent aussi quand le token vient d'être rafraîchi
    const isLoggedIn = "user" in result && !!result.user;
    const userRole = "user" in result ? result.user?.user?.role : undefined;
    const protectedRoute = isRouteProtected(userRole ?? "", nextUrl.pathname);

    if (isLoggedIn && protectedRoute) {
      return withRefreshedCookie(NextResponse.redirect(new URL("/unauthorized", nextUrl)));
    }

    if (isAuthRoute && isLoggedIn) {
      return withRefreshedCookie(NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl)));
    }

    if (!isPublicRoute && !isAuthRoute && !isLoggedIn) {
      const callbackUrl = nextUrl.search
        ? `${nextUrl.pathname}${nextUrl.search}`
        : nextUrl.pathname;
      return NextResponse.redirect(
        new URL(
          `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
          nextUrl
        )
      );
    }

    // Injecter x-nonce dans la requête transmise à l'app
    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("x-nonce", nonce);
    return withRefreshedCookie(response);
  } catch (error) {
    console.error("Erreur dans le middleware:", error);
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }
}

export const config = {
  // Runtime Node.js (Next ≥ 15.5) : nécessaire pour Prisma et le déchiffrement des tokens
  runtime: "nodejs",
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
