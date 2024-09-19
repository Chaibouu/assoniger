import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyEncryptedJWT } from "@/lib/tokens"; // Fonction pour vérifier et déchiffrer le JWT

export async function makeAuthenticatedRequest(
  url: string,
  options: RequestInit = {}
) {
  try {
    const cookieStore = cookies();

    // Récupérer le token d'accès et le token de rafraîchissement depuis les cookies
    let accessToken = cookieStore.get("accessToken")?.value;
    const refreshToken = cookieStore.get("refreshToken")?.value;

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: "Tokens manquants ou invalides" },
        { status: 401 }
      );
    }

    try {
      // Vérifier et déchiffrer le token d'accès
      verifyEncryptedJWT(accessToken);
    } catch (error) {
      // Si le token d'accès est invalide ou expiré, essayer de le rafraîchir
      const refreshResponse = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: "Impossible de rafraîchir le token" },
          { status: 401 }
        );
      }

      const refreshData = await refreshResponse.json();

      // Mettre à jour les cookies avec le nouveau token d'accès
      cookies().set("accessToken", refreshData.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1 heure
      });

      // Utiliser le nouveau token d'accès
      accessToken = refreshData.accessToken;
    }

    // Faire la requête authentifiée avec le token d'accès
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`, // Ajouter le token d'accès dans l'en-tête
      },
    });

    if (!response.ok) {
      throw new Error(`Erreur lors de la requête : ${response.statusText}`);
    }

    return await response.json(); // Retourner la réponse JSON si la requête réussit
  } catch (error) {
    console.error("Erreur dans makeAuthenticatedRequest:", error);
    throw new Error("Erreur lors de la requête authentifiée");
  }
}
