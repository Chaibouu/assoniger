"use server";

import { callRoute } from "@/lib/internal-route";
import { POST as confirmEmailChangeRoute } from "@/app/api/auth/change-email/confirm/route";

export async function verifyEmail(token: string) {
  try {
    // Vérifier si le token est présent
    if (!token) {
      return { error: "Le token est manquant" };
    }

    // Appel direct de la route de confirmation du changement d'email
    const { ok, data } = await callRoute<{ error?: string; message?: string }>(
      confirmEmailChangeRoute,
      "/api/auth/change-email/confirm",
      { body: { token } }
    );

    if (!ok) {
      return { error: data.error };
    }

    // Si l'adresse a été mise à jour avec succès
    return { success: data.message };
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    return { error: "Erreur serveur. Veuillez réessayer plus tard." };
  }
}
