"use server";

export const verify = async (token: string) => {
  try {
    // Appeler l'API verify
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      // Afficher l'erreur envoyée par le backend
      return {
        error: result.error || "Erreur lors de la vérification de l'email",
      };
    }

    return { success: "Compte vérifié avec succès" };
  } catch (error) {
    console.error("Erreur dans verifyAction:", error);
    return { error: "Erreur serveur" };
  }
};
