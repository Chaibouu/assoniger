import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import {
  verifyVerificationToken,
  generateVerificationToken,
} from "@/lib/tokens";
import {
  getVerificationTokenByTokenId,
  getVerificationTokenByToken,
} from "@/data/verification-token";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    // Vérifier le token avec la clé publique RSA
    const { tokenPayload, error } = await verifyVerificationToken(token);

    // Cas du token expiré ou invalide
    if (error === "Token expiré") {
      const storedToken = await getVerificationTokenByToken(token);
      // Les tokens de changement d'email (liés à un userId) se traitent via /api/auth/change-email/confirm
      if (!storedToken || storedToken.userId) {
        return NextResponse.json(
          { error: "Token introuvable" },
          { status: 400 }
        );
      }

      const newToken = await generateVerificationToken(storedToken.email);
      await sendVerificationEmail(storedToken.email, newToken);

      return NextResponse.json(
        {
          error: "Token expiré. Un nouvel email de vérification a été envoyé.",
        },
        { status: 400 }
      );
    }

    if (error === "Token invalide") {
      return NextResponse.json({ error: "Token invalide" }, { status: 400 });
    }

    // Récupérer l'email et le tokenId à partir du tokenPayload
    const { email, tokenId } = tokenPayload as {
      email: string;
      tokenId: string;
    };

    // Vérifier si le token est toujours valide dans la base de données
    const storedToken = await getVerificationTokenByTokenId(tokenId);
    if (!storedToken || storedToken.userId) {
      return NextResponse.json(
        { error: "Token introuvable ou déjà utilisé" },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: { email: storedToken.email, isDeleted: false },
      select: { id: true, role: true, emailVerified: true },
    });
    if (!user || storedToken.email.toLowerCase() !== String(email).toLowerCase()) {
      return NextResponse.json(
        { error: "Token introuvable ou déjà utilisé" },
        { status: 400 }
      );
    }

    // La vérification d'email n'active que les comptes USER jamais vérifiés.
    // Les comptes ASSOCIATION et MEMBER restent inactifs jusqu'à la modération
    // (validation du dossier / approbation de la demande d'adhésion).
    const activate = user.role === UserRole.USER && !user.emailVerified;

    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date(), ...(activate ? { isActive: true } : {}) },
    });

    // Supprimer le token de vérification après activation
    await db.verificationToken.delete({
      where: { id: storedToken.id },
    });

    return NextResponse.json(
      { message: "Compte vérifié avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la vérification du token :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
