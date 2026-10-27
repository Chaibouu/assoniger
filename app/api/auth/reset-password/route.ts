import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { verifyPasswordResetToken } from "@/lib/tokens";
import { getUserByEmail } from "@/data/user";
import { db } from "@/lib/db";
import { ResetPasswordSchema } from "@/schemas";
import { getPwnedPasswordError } from "@/lib/hibp";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    // Vérifier si le token est manquant
    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    // Vérifier si le nouveau mot de passe est manquant
    if (!newPassword) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe est requis" },
        { status: 400 }
      );
    }

    // Validation des données avec Zod
    const parsedData = ResetPasswordSchema.safeParse({ token, newPassword });

    // Si la validation échoue, renvoyer les erreurs de Zod
    if (!parsedData.success) {
      return NextResponse.json(
        {
          error: parsedData.error.issues
            .map((issue) => issue.message)
            .join(", "),
        },
        { status: 400 }
      );
    }

    // Vérifier et décoder le token
    const { tokenPayload, error } = await verifyPasswordResetToken(token);

    // Gestion des erreurs liées au token
    if (error === "Token expiré") {
      return NextResponse.json(
        { error: "Le token a expiré. Veuillez demander un nouveau lien." },
        { status: 400 }
      );
    }

    if (error === "Token invalide") {
      return NextResponse.json(
        {
          error:
            "Le token est invalide. Veuillez vérifier le lien ou demander un nouveau.",
        },
        { status: 400 }
      );
    }

    if (!tokenPayload) {
      return NextResponse.json(
        { error: "Impossible de vérifier le token. Veuillez réessayer." },
        { status: 400 }
      );
    }

    const { email, tokenId } = tokenPayload as {
      email: string;
      tokenId: string;
    };

    // Recherche de l'utilisateur par email
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si le token est valide et non utilisé
    const passwordResetToken = await db.passwordResetToken.findUnique({
      where: { tokenId },
    });
    if (!passwordResetToken) {
      return NextResponse.json(
        { error: "Le token est invalide ou a déjà été utilisé." },
        { status: 400 }
      );
    }

    const pwnedError = await getPwnedPasswordError(newPassword);
    if (pwnedError) {
      return NextResponse.json({ error: pwnedError }, { status: 400 });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Nouveau mot de passe + révocation de toutes les sessions ouvertes (un éventuel
    // attaquant connecté est déconnecté) + suppression du token à usage unique
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      db.session.deleteMany({ where: { userId: user.id } }),
      db.failedLoginAttempt.deleteMany({ where: { userId: user.id } }),
      db.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      }),
    ]);

    return NextResponse.json(
      { message: "Mot de passe réinitialisé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation du mot de passe :",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
