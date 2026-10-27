"use server";

import { PasswordResetSchema } from "@/schemas";
import { callRoute } from "@/lib/internal-route";
import { POST as forgotPasswordRoute } from "@/app/api/auth/forgot-password/route";

export const forgotPassword = async (data: { email: string }) => {
  const validatedData = PasswordResetSchema.safeParse(data);

  if (!validatedData.success) {
    return {
      error: validatedData.error.issues
        .map((issue) => issue.message)
        .join(", "),
    };
  }

  const { email } = validatedData.data;

  try {
    // Appel direct de la route forgot-password (IP réelle du visiteur transmise)
    const { ok, data: result } = await callRoute<{ error?: string; message?: string }>(
      forgotPasswordRoute,
      "/api/auth/forgot-password",
      { body: { email } }
    );

    if (!ok) {
      // Afficher l'erreur envoyée par le backend
      return {
        error:
          result.error || "Erreur lors de la réinitialisation du mot de passe",
      };
    }

    return {
      success:
        result.message ||
        "Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.",
    };
  } catch (error) {
    console.error("Erreur dans forgotPasswordAction:", error);
    return { error: "Erreur serveur" };
  }
};
