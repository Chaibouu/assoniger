"use server";

import { callRoute } from "@/lib/internal-route";
import { POST as resendVerificationRoute } from "@/app/api/auth/resend-verification/route";

export const resendVerification = async (email: string) => {
  try {
    // Appel direct de la route resend-verification (IP réelle du visiteur transmise)
    const { ok, data: result } = await callRoute<{ error?: string; message?: string }>(
      resendVerificationRoute,
      "/api/auth/resend-verification",
      { body: { email } }
    );

    if (!ok) {
      // Afficher l'erreur envoyée par le backend
      return {
        error:
          result.error || "Erreur lors de l'envoi de l'email de vérification",
      };
    }

    return {
      success:
        result.message ||
        "Si un compte non vérifié existe pour cette adresse, un nouvel email de vérification a été envoyé.",
    };
  } catch (error) {
    console.error("Erreur dans resendVerificationAction:", error);
    return { error: "Erreur serveur" };
  }
};
