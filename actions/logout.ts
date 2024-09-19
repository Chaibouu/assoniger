"use server";

import { cookies } from "next/headers";

export const logout = async () => {
  try {
    // Appeler l'API logout
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/logout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      // Afficher l'erreur envoyée par le backend
      return { error: result.error || "Erreur lors de la déconnexion" };
    }

    // Supprimer les cookies d'accès et de rafraîchissement
    const cookieStore = cookies();
    cookieStore.set("accessToken", "", { maxAge: -1, path: "/" });
    cookieStore.set("refreshToken", "", { maxAge: -1, path: "/" });

    return { success: "Déconnexion réussie" };
  } catch (error) {
    console.error("Erreur dans logoutAction:", error);
    return { error: "Erreur serveur" };
  }
};
