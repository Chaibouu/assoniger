"use server";

import { callRoute } from "@/lib/internal-route";
import { POST as verifyRoute } from "@/app/api/auth/verify/route";

export async function verifyUserToken(token: string) {
  try {
    // Vérifier si le token est présent
    if (!token) {
      return { error: "Le token est manquant" };
    }

    // Appel direct de la route /api/auth/verify
    const { ok, data } = await callRoute<{ error?: string; message?: string }>(
      verifyRoute,
      "/api/auth/verify",
      { body: { token } }
    );

    if (!ok) {
      return { error: data.error };
    }

    // Si le compte a été vérifié avec succès
    return { success: data.message };
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    return { error: "Erreur serveur. Veuillez réessayer plus tard." };
  }
}
