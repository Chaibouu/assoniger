"use server";

import { resetPasswordSchema } from "@/schemas";
import { callRoute } from "@/lib/internal-route";
import { POST as resetPasswordRoute } from "@/app/api/auth/reset-password/route";

export const resetPassword = async (data: {
  token: string;
  newPassword: string;
}) => {
  const validatedData = resetPasswordSchema.safeParse(data);

  if (!validatedData.success) {
    return {
      error: validatedData.error.issues
        .map((issue) => issue.message)
        .join(", "),
    };
  }

  const { token, newPassword } = validatedData.data;

  try {
    // Appel direct de la route reset-password (IP réelle du visiteur transmise)
    const { ok, data: result } = await callRoute<{ error?: string }>(
      resetPasswordRoute,
      "/api/auth/reset-password",
      { body: { token, newPassword } }
    );

    if (!ok) {
      // Afficher l'erreur envoyée par le backend
      return {
        error:
          result.error || "Erreur lors de la réinitialisation du mot de passe",
      };
    }

    return { success: "Mot de passe réinitialisé avec succès." };
  } catch (error) {
    console.error("Erreur dans resetPasswordAction:", error);
    return { error: "Erreur serveur" };
  }
};
