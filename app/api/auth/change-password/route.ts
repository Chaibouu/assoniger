import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/tokens";
import { getPwnedPasswordError } from "@/lib/hibp";

export async function POST(req: NextRequest) {
  try {
    const { oldPassword, newPassword } = await req.json();
    const authHeader = req.headers.get("Authorization");

    // Vérifier si l'utilisateur est authentifié
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    // Extraire le token et obtenir l'ID utilisateur
    const token = authHeader.split(" ")[1];
    const payload = await verifyAccessToken(token);
    const userId = payload?.userId;
    // Pas de changement de mot de passe depuis une session d'impersonation
    if (!payload || !userId || payload.isImpersonation) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    // Vérifier les données
    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: "L'ancien et le nouveau mot de passe sont requis" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit comporter au moins 8 caractères" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "L'ancien mot de passe est incorrect" },
        { status: 403 }
      );
    }

    const pwnedError = await getPwnedPasswordError(newPassword);
    if (pwnedError) {
      return NextResponse.json({ error: pwnedError }, { status: 400 });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe et fermer les autres sessions (la session courante est conservée)
    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      }),
      db.session.deleteMany({
        where: { userId, ...(payload.sid ? { NOT: { id: payload.sid } } : {}) },
      }),
    ]);

    return NextResponse.json(
      { message: "Mot de passe modifié avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la modification du mot de passe :", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la modification du mot de passe" },
      { status: 500 }
    );
  }
}
