import { NextResponse, userAgent } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { createEncryptedJWT, generateVerificationToken } from "@/lib/tokens";
import { createSession } from "@/data/session";
import appConfig from "@/settings";
import { sendVerificationEmail, sendLoginNotificationEmail } from "@/lib/mail";
import { getGeoInfo, getClientIP } from "@/lib/geo";
import {
  getBackoffDelay,
  getFailedAttempts,
  incrementFailedAttempt,
  resetFailedAttempts,
} from "@/lib/backoff";
import { LoginSchema } from "@/schemas";
import { audit } from "@/lib/audit";
import { checkPasswordPwned } from "@/lib/hibp";
import { rateLimitRedisAuth, rateLimitRedisEmailTarget } from "@/lib/rateLimit";
import type { NextRequest } from "next/server";

/** Hash bcrypt d'un mot de passe factice : coût constant quand l'email est inconnu (anti-énumération). */
const DUMMY_PASSWORD_HASH = "$2a$10$CCqy0R34VKSiKyTt0t.adefeq9k9RnTMlFcgZUW7kNn68iRD2JZJ2";

function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    // ─── Rate limiting Redis (couche 2 — persistant multi-instance) ──────────
    const ip = getClientIP(req);
    const rlResponse = await rateLimitRedisAuth(ip);
    if (rlResponse) return rlResponse;

    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";
    const rememberMe = Boolean(body.rememberMe);

    if (!email) return NextResponse.json({ error: "L'email est requis" }, { status: 400 });
    if (!password) return NextResponse.json({ error: "Le mot de passe est requis" }, { status: 400 });

    const parsedData = LoginSchema.safeParse({ email, password, rememberMe });
    if (!parsedData.success) {
      return NextResponse.json(
        { error: parsedData.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);

    if (!user) {
      // Même coût qu'une vraie vérification : le temps de réponse ne révèle pas si l'email existe
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
      await audit({ action: "LOGIN_FAILURE", ipAddress: ip, status: "FAILURE", metadata: { email, reason: "Email introuvable" } });
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    // ─── Backoff progressif ───────────────────────────────────────────────────
    const failedAttempts = await getFailedAttempts(user.id);
    if (failedAttempts >= appConfig.backoff.maxAttempts) {
      const delay = getBackoffDelay(failedAttempts);
      const lastFailed = await db.failedLoginAttempt.findFirst({
        where: { userId: user.id },
        orderBy: { attemptAt: "desc" },
      });
      const elapsed = lastFailed?.attemptAt ? Date.now() - new Date(lastFailed.attemptAt).getTime() : 0;
      const remaining = delay - elapsed;
      if (remaining > 0) {
        return NextResponse.json(
          { error: `Trop de tentatives. Réessayez dans ${Math.ceil(remaining / 60000)} minute(s).` },
          { status: 429 }
        );
      }
    }

    // ─── Vérification du mot de passe ─────────────────────────────────────────
    if (!user.password) {
      await incrementFailedAttempt(user.id);
      await audit({
        userId: user.id,
        action: "LOGIN_FAILURE",
        ipAddress: ip,
        status: "FAILURE",
        metadata: { reason: "Mot de passe absent sur le compte" },
      });
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await incrementFailedAttempt(user.id);
      await audit({ userId: user.id, action: "LOGIN_FAILURE", ipAddress: ip, status: "FAILURE", metadata: { reason: "Mot de passe incorrect" } });
      return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 });
    }

    await resetFailedAttempts(user.id);

    // ─── État du compte : seulement APRÈS le mot de passe ─────────────────────
    // (sinon n'importe qui pourrait savoir si une adresse a un compte, et en déclencher les emails)
    if (!user.emailVerified) {
      // Renvoi limité par adresse : la personne a le bon mot de passe mais peut réessayer en boucle
      const limited = await rateLimitRedisEmailTarget(user.email as string);
      if (!limited) {
        const verificationToken = await generateVerificationToken(user.email as string);
        await sendVerificationEmail(user.email as string, verificationToken);
      }
      return NextResponse.json(
        {
          error: limited
            ? "Veuillez vérifier votre email : un lien de vérification vous a déjà été envoyé récemment."
            : "Veuillez vérifier votre email. Un nouvel email de vérification a été envoyé.",
        },
        { status: 403 }
      );
    }

    if (!user.isActive) {
      // Comptes association / membre : inactifs tant que la modération n'a pas validé
      const awaitingModeration = user.role === "ASSOCIATION" || user.role === "MEMBER";
      return NextResponse.json(
        {
          error: awaitingModeration
            ? "Votre compte est en attente de validation. Vous serez notifié dès qu'il sera activé."
            : "Votre compte est désactivé. Contactez l'administrateur.",
        },
        { status: 403 }
      );
    }

    // ─── 2FA TOTP requis ? ────────────────────────────────────────────────────
    if (user.isTwoFactorEnabled) {
      // Retourner un challenge token court (5 min) — pas encore de session
      const tempToken = createEncryptedJWT(
        { userId: user.id, purpose: "2fa_challenge" },
        "5m"
      );
      return NextResponse.json({ requires2FA: true, tempToken }, { status: 200 });
    }

    // ─── Pas de 2FA — créer la session directement ────────────────────────────
    if (!appConfig.allowMultipleSessions) {
      await db.session.deleteMany({ where: { userId: user.id } });
    }

    const sessionId = crypto.randomUUID();
    const accessToken = createEncryptedJWT(
      { userId: user.id, email: user.email, sid: sessionId },
      "1h"
    );
    const rawRefreshToken = crypto.randomBytes(64).toString("hex");

    await createSession({
      id: sessionId,
      userId: user.id,
      sessionToken: accessToken,
      refreshToken: hashRefreshToken(rawRefreshToken),
      expires: new Date(Date.now() + 60 * 60 * 1000),
      refreshTokenExpires: rememberMe
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      lastActivity: new Date(),
      isImpersonation: false,
      impersonatedBy: null,
      isDeleted: false,
    });

    // ─── Device + géoloc ──────────────────────────────────────────────────────
    const { device, browser, os } = userAgent(req);
    const geoInfo = await getGeoInfo(req);

    const deviceRecord = await db.userDevice.create({
      data: {
        userId: user.id,
        device: `${device.vendor ?? "Inconnu"} ${device.model ?? "Inconnu"}`,
        os: `${os.name ?? "Inconnu"} ${os.version ?? ""}`,
        browser: `${browser.name ?? "Inconnu"} ${browser.version ?? ""}`,
        ipAddress: ip,
        latitude: geoInfo?.latitude ?? null,
        longitude: geoInfo?.longitude ?? null,
        city: geoInfo?.city ?? "Ville inconnue",
        country: geoInfo?.country ?? "Pays inconnu",
      },
    });

    // ─── Audit ────────────────────────────────────────────────────────────────
    await audit({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      ipAddress: ip,
      status: "SUCCESS",
      metadata: { email: user.email, deviceId: deviceRecord.id },
    });

    // ─── Notification email si nouvelle IP ───────────────────────────────────
    const existingDevicesWithIp = await db.userDevice.count({
      where: { userId: user.id, ipAddress: ip },
    });

    if (existingDevicesWithIp <= 1) {
      sendLoginNotificationEmail(user.email as string, {
        device: `${device.vendor ?? ""} ${device.model ?? ""}`.trim() || "Inconnu",
        browser: `${browser.name ?? ""} ${browser.version ?? ""}`.trim() || "Inconnu",
        os: `${os.name ?? ""} ${os.version ?? ""}`.trim() || "Inconnu",
        ip,
        city: geoInfo?.city ?? "Inconnue",
        country: geoInfo?.country ?? "Inconnu",
        time: new Date().toLocaleString("fr-FR", { timeZone: "UTC" }),
      }).catch(() => {}); // Non-bloquant, ne pas rater le login si l'email échoue
    }

    return NextResponse.json({
      message: "Connexion réussie",
      accessToken,
      refreshToken: rawRefreshToken,
    });
  } catch (error) {
    console.error("Erreur lors de la connexion :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
