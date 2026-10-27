import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { refreshSession } from "@/lib/session";
import { getUserIdFromToken } from "@/lib/tokens";

// Types pour les réponses d'authentification
export interface AuthResult {
  success: boolean;
  accessToken?: string;
  error?: string;
}

export interface AuthenticatedUser {
  accessToken: string;
  userId: string;
}

/**
 * Access token valide de la requête courante : celui du cookie s'il est encore accepté,
 * sinon un nouveau émis via le refresh token. null si la session n'est plus valable.
 */
async function resolveAccessToken(): Promise<{ accessToken: string; userId: string } | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) return null;

  if (accessToken) {
    const userId = await getUserIdFromToken(accessToken);
    if (userId) return { accessToken, userId };
    // Token expiré ou révoqué → rafraîchissement ci-dessous
  }

  const refreshed = await refreshSession(refreshToken);
  if ("error" in refreshed) return null;

  const userId = await getUserIdFromToken(refreshed.accessToken);
  if (!userId) return null;

  // Impossible de poser un cookie depuis un Server Component : le middleware le fera
  // à la requête suivante. Dans une Server Action ou une route, le cookie est mis à jour.
  try {
    cookieStore.set("accessToken", refreshed.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: refreshed.accessTokenExpiresAt,
      path: "/",
      sameSite: "lax",
    });
  } catch {
    // contexte en lecture seule
  }

  return { accessToken: refreshed.accessToken, userId };
}

// Fonction pour récupérer l'utilisateur authentifié
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const session = await resolveAccessToken();
  if (!session) {
    redirect("/auth/login");
  }
  return session;
}

// Fonction pour vérifier si l'utilisateur est authentifié (sans redirection)
export async function isAuthenticated(): Promise<boolean> {
  try {
    return (await resolveAccessToken()) !== null;
  } catch {
    return false;
  }
}

// Fonction pour déconnecter l'utilisateur
export async function logoutUser(): Promise<void> {
  const cookieStore = await cookies();

  // Supprimer les cookies d'authentification
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");

  redirect("/auth/login");
}

// Fonction pour valider les permissions
export async function requirePermission(permission: string): Promise<void> {
  const { accessToken } = await getAuthenticatedUser();

  // Vérifiez les permissions dans votre token ou base de données
  // Exemple basique
  const payload = JSON.parse(atob(accessToken.split(".")[1]));
  const userPermissions = payload.permissions || [];

  if (!userPermissions.includes(permission)) {
    redirect("/unauthorized");
  }
}
