"use server";

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { callRoute } from "@/lib/internal-route";
import { hashRefreshToken } from "@/lib/session";
import { POST as logoutRoute } from "@/app/api/auth/logout/route";

export const logout = async () => {
  const cookieStore = await cookies();

  // Récupérer les tokens d'accès, de rafraîchissement et d'impersonation
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;
  const impersonationToken = cookieStore.get("impersonationToken")?.value;

  try {
    // Révocation de toutes les sessions du compte (si l'access token est encore valide)
    if (accessToken) {
      await callRoute(logoutRoute, "/api/auth/logout", { body: { token: accessToken } });
    }

    // Révocation de la session courante via le refresh token (fonctionne même si l'access token a expiré)
    if (refreshToken) {
      await db.session.deleteMany({
        where: { refreshToken: hashRefreshToken(refreshToken) },
      });
    }

    // Fin d'une éventuelle session d'audit
    if (impersonationToken) {
      await db.session.deleteMany({
        where: { sessionToken: impersonationToken, isImpersonation: true },
      });
    }
  } catch (error) {
    console.error("Erreur dans logoutAction:", error);
  } finally {
    // Les cookies sont toujours supprimés : l'utilisateur est déconnecté côté navigateur quoi qu'il arrive
    cookieStore.delete("accessToken");
    cookieStore.delete("refreshToken");
    cookieStore.delete("impersonationToken");
  }

  return { success: "Déconnexion réussie" };
};
