import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createEncryptedJWT } from "@/lib/tokens";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Token de rafraîchissement manquant" },
        { status: 400 }
      );
    }

    // Rechercher le token de rafraîchissement dans la base de données
    const session = await db.session.findUnique({
      where: { refreshToken },
    });

    if (!session || new Date() > session.refreshTokenExpires) {
      return NextResponse.json(
        { error: "Token de rafraîchissement expiré ou introuvable" },
        { status: 403 }
      );
    }

    // Générer un nouveau token d'accès chiffré avec JWE
    const payload = { userId: session.userId }; // Charger les informations utilisateur
    const newAccessToken = createEncryptedJWT(payload, "1h"); // Expiration 1h

    // Calculer l'heure d'expiration du token d'accès
    const accessTokenExpiresAt = Math.floor(Date.now() / 1000) + 60 * 60; // Expire dans 1 heure (en secondes)

    // Mettre à jour la session avec le nouveau token d'accès et l'heure d'expiration
    await db.session.update({
      where: { id: session.id },
      data: {
        sessionToken: newAccessToken, // Stocker le nouveau token d'accès chiffré
        expires: new Date(accessTokenExpiresAt * 1000), // Expiration en format `Date`
      },
    });

    // Renvoie du nouveau token d'accès au client, avec l'heure d'expiration au format UNIX (en secondes)
    return NextResponse.json({
      accessToken: newAccessToken,
      accessTokenExpiresAt, // Expiration en secondes UNIX pour faciliter la manipulation côté client
    });
  } catch (error) {
    console.error("Erreur lors du rafraîchissement des tokens :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
