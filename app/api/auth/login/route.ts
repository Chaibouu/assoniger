import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { createEncryptedJWT, generateVerificationToken } from "@/lib/tokens";
import { createSession } from "@/data/session";
import appConfig from "@/settings";
import { sendVerificationEmail } from "@/lib/mail";
import UAParser from "ua-parser-js";

export async function POST(req: Request) {
  try {
    const { email, password, rememberMe } = await req.json();

    // Vérification individuelle des champs manquants
    if (!email) {
      return NextResponse.json(
        { error: "L'email est requis" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Le mot de passe est requis" },
        { status: 400 }
      );
    }

    // Recherche de l'utilisateur par email
    const user = await getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 401 }
      );
    }

    // Vérifier si l'utilisateur a confirmé son email
    if (!user.emailVerified) {
      // Générer un nouveau token de vérification
      const verificationToken = await generateVerificationToken(
        user.email as string
      );

      // Envoyer un nouvel email de vérification
      await sendVerificationEmail(user.email as string, verificationToken);

      return NextResponse.json(
        {
          error:
            "Veuillez vérifier votre email avant de vous connecter. Un nouvel email de vérification a été envoyé.",
        },
        { status: 403 }
      );
    }

    // Vérifier si l'utilisateur est désactivé
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Votre compte est désactivé. Contactez l'administrateur." },
        { status: 403 }
      );
    }
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password as string
    );
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Gestion des connexions multiples selon la configuration
    if (!appConfig.allowMultipleSessions) {
      // Supprimer les anciennes sessions si les connexions multiples ne sont pas autorisées
      await db.session.deleteMany({
        where: { userId: user.id },
      });
    }

    // Payload pour le JWT
    const payload = { userId: user.id, email: user.email };
    // Générer un token d'accès chiffré avec JWE
    const accessToken = createEncryptedJWT(payload, "1h");

    // Générer un token de rafraîchissement (non-JWT)
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // Créer la session dans la base de données
    await createSession({
      userId: user.id,
      sessionToken: accessToken, // Token d'accès chiffré
      refreshToken,
      expires: new Date(Date.now() + 60 * 60 * 1000), // 1h pour le token d'accès
      refreshTokenExpires: rememberMe
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      lastActivity: new Date(),
    });

    // Extraire les informations du User-Agent
    const userAgent = req.headers.get("user-agent") || "";
    const parser = new UAParser(userAgent);
    const deviceInfo = parser.getResult();

    // Stocker les informations de l'appareil dans la table UserDevice
    await db.userDevice.create({
      data: {
        userId: user.id,
        device: `${deviceInfo.device.vendor} ${deviceInfo.device.model}`, // Appareil
        os: `${deviceInfo.os.name} ${deviceInfo.os.version}`, // Système d'exploitation
        browser: `${deviceInfo.browser.name} ${deviceInfo.browser.version}`, // Navigateur
        ipAddress:
          req.headers.get("x-forwarded-for") ||
          req.headers.get("remote-addr") ||
          "", // Adresse IP
      },
    });

    // Renvoyer les deux tokens (access token et refresh token) au client
    return NextResponse.json({
      message: "Connexion réussie",
      accessToken: accessToken, // Le client stockera ce token d'accès brut
      refreshToken: refreshToken, // Le client stockera également ce token de rafraîchissement brut
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
