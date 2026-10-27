import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  generateVerificationTokenForModifyEmail,
  verifyAccessToken,
} from "@/lib/tokens";
import { sendChangeEmailVerification } from "@/lib/mail";
import { rateLimitRedis, rateLimitRedisEmailTarget } from "@/lib/rateLimit";
import appConfig from "@/settings";

export async function POST(req: NextRequest) {
  try {
    const { newEmail } = await req.json();
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const payload = await verifyAccessToken(token);
    const userId = payload?.userId;

    if (!payload || !userId) {
      return NextResponse.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      );
    }

    // Une session d'impersonation (audit) ne doit pas pouvoir modifier les identifiants du compte
    if (payload.isImpersonation) {
      return NextResponse.json(
        { error: "Action impossible pendant une session d'audit" },
        { status: 403 }
      );
    }

    if (typeof newEmail !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      return NextResponse.json(
        { error: "La nouvelle adresse e-mail est requise" },
        { status: 400 }
      );
    }

    // Anti email-bombing : par compte demandeur et par adresse destinataire
    const rlResponse =
      (await rateLimitRedis(`email-change:${userId}`, appConfig.rateLimitEmail)) ??
      (await rateLimitRedisEmailTarget(newEmail));
    if (rlResponse) return rlResponse;

    const emailExists = await db.user.findUnique({
      where: { email: newEmail },
    });
    if (emailExists) {
      return NextResponse.json(
        { error: "Cette adresse e-mail est déjà utilisée" },
        { status: 400 }
      );
    }

    const verificationToken = await generateVerificationTokenForModifyEmail(
      newEmail,
      userId
    );

    await sendChangeEmailVerification(newEmail, verificationToken);

    return NextResponse.json(
      {
        message:
          "Un e-mail de confirmation a été envoyé à la nouvelle adresse.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la demande de changement d'email :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
