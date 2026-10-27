"use server";

import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { authenticator } from "otplib";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createEncryptedJWT, getPurposeTokenPayload } from "@/lib/tokens";
import appConfig from "@/settings";

/**
 * Activation / désactivation de la double authentification (TOTP) depuis le profil.
 * Le secret en cours d'activation reste côté serveur (jeton chiffré en cookie httpOnly, 10 min) :
 * le navigateur ne le renvoie jamais et ne peut donc pas imposer son propre secret.
 */

const SETUP_COOKIE = "twoFactorSetup";
const SETUP_PURPOSE = "2fa_setup";

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** Utilisateur connecté réel (jamais une session d'audit / impersonation). */
async function currentUser() {
  const session = await getUser();
  if (!("user" in session) || !session.user?.user) return null;
  if (session.isImpersonation || session.user.isImpersonation) return null;
  return db.user.findFirst({
    where: { id: session.user.user.id, isDeleted: false, isActive: true },
    select: { id: true, email: true, password: true, isTwoFactorEnabled: true, twoFactorSecret: true },
  });
}

/** Étape 1 : génère un secret et le QR code à scanner. */
export async function startTwoFactorSetup(): Promise<
  ActionResult<{ qrCodeDataUrl: string; secret: string }>
> {
  const user = await currentUser();
  if (!user?.email) return { ok: false, error: "Session expirée, veuillez vous reconnecter." };
  if (user.isTwoFactorEnabled) {
    return { ok: false, error: "La double authentification est déjà activée." };
  }

  const secret = authenticator.generateSecret(20);
  const otpauthUrl = authenticator.keyuri(user.email, appConfig.appName, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, { errorCorrectionLevel: "M", width: 240, margin: 1 });

  (await cookies()).set(
    SETUP_COOKIE,
    createEncryptedJWT({ userId: user.id, purpose: SETUP_PURPOSE, secret }, "10m"),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 10 * 60,
      path: "/",
    }
  );

  // Le secret est affiché pour une saisie manuelle si le QR code ne peut pas être scanné
  return { ok: true, qrCodeDataUrl, secret };
}

/** Étape 2 : vérifie le premier code de l'application, puis active la 2FA. */
export async function confirmTwoFactorSetup(code: string): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée, veuillez vous reconnecter." };

  const cookieStore = await cookies();
  const payload = getPurposeTokenPayload(cookieStore.get(SETUP_COOKIE)?.value ?? "", SETUP_PURPOSE) as
    | (ReturnType<typeof getPurposeTokenPayload> & { secret?: string })
    | null;
  if (!payload?.secret || payload.userId !== user.id) {
    return { ok: false, error: "La configuration a expiré. Recommencez l'activation." };
  }

  const normalized = String(code ?? "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalized) || !authenticator.verify({ token: normalized, secret: payload.secret })) {
    return { ok: false, error: "Code invalide. Vérifiez l'heure de votre téléphone et réessayez." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: payload.secret, isTwoFactorEnabled: true },
  });
  cookieStore.delete(SETUP_COOKIE);
  await audit({ userId: user.id, action: "2FA_ENABLED", status: "SUCCESS" });
  revalidatePath("/dashboard/profile");
  return { ok: true };
}

/** Annule une activation en cours. */
export async function cancelTwoFactorSetup(): Promise<void> {
  (await cookies()).delete(SETUP_COOKIE);
}

/** Désactivation : exige le mot de passe ET un code valide (preuve des deux facteurs). */
export async function disableTwoFactor(password: string, code: string): Promise<ActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Session expirée, veuillez vous reconnecter." };
  if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
    return { ok: false, error: "La double authentification n'est pas activée." };
  }
  if (!user.password || !(await bcrypt.compare(String(password ?? ""), user.password))) {
    return { ok: false, error: "Mot de passe incorrect." };
  }
  const normalized = String(code ?? "").replace(/\s+/g, "");
  if (!authenticator.verify({ token: normalized, secret: user.twoFactorSecret })) {
    return { ok: false, error: "Code invalide." };
  }

  await db.user.update({
    where: { id: user.id },
    data: { isTwoFactorEnabled: false, twoFactorSecret: null },
  });
  await audit({ userId: user.id, action: "2FA_DISABLED", status: "SUCCESS" });
  revalidatePath("/dashboard/profile");
  return { ok: true };
}
