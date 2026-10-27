import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  generateVerificationTokenForModifyEmail,
  verifyVerificationToken,
} from "@/lib/tokens";
import { getUserByEmail } from "@/data/user";
import {
  getVerificationTokenByTokenId,
  getVerificationTokenByToken,
} from "@/data/verification-token";
import { sendChangeEmailVerification } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }

    const { tokenPayload, error } = await verifyVerificationToken(token);

    if (error === "Token expiré") {
      const storedToken = await getVerificationTokenByToken(token);
      // Seul un token de changement d'email (lié à un utilisateur) peut être renouvelé ici
      if (!storedToken?.userId) {
        return NextResponse.json(
          { error: "Token introuvable" },
          { status: 400 }
        );
      }

      const newToken = await generateVerificationTokenForModifyEmail(
        storedToken.email,
        storedToken.userId
      );
      await sendChangeEmailVerification(storedToken.email, newToken);

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

    const { email, tokenId, userId } = (tokenPayload ?? {}) as {
      email?: unknown;
      tokenId?: unknown;
      userId?: unknown;
    };

    // Un token de vérification d'inscription n'a pas de userId : il ne doit jamais être accepté ici
    // (avec Prisma, `id: undefined` désactiverait le filtre et ciblerait un autre compte).
    if (
      typeof userId !== "string" ||
      !userId ||
      typeof tokenId !== "string" ||
      typeof email !== "string"
    ) {
      return NextResponse.json({ error: "Token invalide" }, { status: 400 });
    }

    const storedToken = await getVerificationTokenByTokenId(tokenId);
    if (
      !storedToken ||
      storedToken.userId !== userId ||
      storedToken.email.toLowerCase() !== email.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Token introuvable ou déjà utilisé" },
        { status: 400 }
      );
    }

    const user = await db.user.findFirst({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // L'adresse a pu être prise entre la demande et la confirmation
    const emailOwner = await getUserByEmail(storedToken.email);
    if (emailOwner && emailOwner.id !== user.id) {
      return NextResponse.json(
        { error: "Cette adresse e-mail est déjà utilisée" },
        { status: 400 }
      );
    }

    await db.user.update({
      where: { id: user.id },
      data: { email: storedToken.email, emailVerified: new Date() },
    });

    await db.verificationToken.delete({ where: { id: storedToken.id } });

    return NextResponse.json(
      { message: "Adresse e-mail mise à jour avec succès." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
