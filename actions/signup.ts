"use server";

import { SignupSchema } from "@/schemas";
import { callRoute } from "@/lib/internal-route";
import { POST as signupRoute } from "@/app/api/auth/signup/route";

export const signup = async (data: {
  name: string;
  email: string;
  password: string;
}) => {
  const validatedData = SignupSchema.safeParse(data);

  if (!validatedData.success) {
    return {
      error: validatedData.error.issues
        .map((issue) => issue.message)
        .join(", "),
    };
  }

  const { name, email, password } = validatedData.data;

  try {
    // Appel direct de la route signup (IP réelle du visiteur transmise)
    const { ok, data: result } = await callRoute<{ error?: string }>(
      signupRoute,
      "/api/auth/signup",
      { body: { name, email, password } }
    );

    if (!ok) {
      // Afficher l'erreur envoyée par le backend
      return { error: result.error || "Erreur lors de l'inscription" };
    }

    return { success: "Inscription réussie. Veuillez vérifier votre email." };
  } catch (error) {
    console.error("Erreur dans signupAction:", error);
    return { error: "Erreur serveur" };
  }
};
