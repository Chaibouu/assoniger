import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  verifyVerificationToken,
  generateVerificationToken,
} from "@/lib/tokens";
import { getVerificationTokenByToken } from "@/data/verification-token";
import { sendVerificationEmail } from "@/lib/mail"; // Pour envoyer un nouveau token si nécessaire

export async function POST(req: Request) {
  try {
    // Récupérer le token à partir du corps de la requête
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    // Vérifier le token avec la clé publique RSA
    const tokenPayload = await verifyVerificationToken(token);

    if (!tokenPayload) {
      // Cas du token invalide
      return NextResponse.json({ error: "Token invalide" }, { status: 400 });
    }
    // Récupérer l'email et le tokenId à partir du payload
    const { email, tokenId } = tokenPayload as {
      email: string;
      tokenId: string;
    };

    // Vérifier si le token est toujours valide dans la base de données
    const storedToken = await getVerificationTokenByToken(tokenId);
    if (!storedToken) {
      return NextResponse.json(
        { error: "Token introuvable ou déjà utilisé" },
        { status: 400 }
      );
    }

    // Vérifier l'expiration du token
    if (new Date() > storedToken.expires) {
      // Cas du token expiré
      // Générer un nouveau token
      const newToken = await generateVerificationToken(email);

      // Envoyer un nouvel email de vérification
      await sendVerificationEmail(email, newToken);

      return NextResponse.json(
        {
          error: "Token expiré. Un nouvel email de vérification a été envoyé.",
        },
        { status: 400 }
      );
    }

    // Activer l'utilisateur en mettant à jour le champ emailVerified
    await db.user.update({
      where: { email },
      data: { emailVerified: new Date(), isActive: true },
    });

    // Supprimer le token de vérification après activation
    await db.verificationToken.delete({
      where: { id: storedToken.id },
    });

    // Réponse de succès
    return NextResponse.json(
      { message: "Compte vérifié avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
