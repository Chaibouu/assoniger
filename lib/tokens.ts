import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";
import { getVerificationTokenByEmail } from "@/data/verification-token";
import { getPasswordResetTokenByEmail } from "@/data/password-reset-token";
import { getTwoFactorTokenByEmail } from "@/data/two-factor-token";
import { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { verify, sign } from "jsonwebtoken";

const privateKey = process.env.RSA_PRIVATE_KEY as string;
const publicKey = process.env.RSA_PUBLIC_KEY as string;
const aesSecretKey = Buffer.from(process.env.AES_SECRET_KEY as string, "hex");
const ALGORITHM = "RS256"; // Algorithme de signature RSA (RS256)

// ─── Helpers AES-256-GCM ──────────────────────────────────────────────────────

/**
 * Chiffre une chaîne avec AES-256-GCM.
 * Retourne "ivBase64.authTagBase64.encryptedBase64"
 */
function aesEncrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12); // 96 bits recommandé pour GCM
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    aesSecretKey,
    iv
  ) as crypto.CipherGCM;

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag().toString("base64");

  return `${iv.toString("base64")}.${authTag}.${encrypted}`;
}

/**
 * Déchiffre un token produit par aesEncrypt().
 * Lève une erreur si l'intégrité (authTag) est invalide.
 */
function aesDecrypt(encryptedToken: string): string {
  const [ivBase64, authTagBase64, encryptedBase64] = encryptedToken.split(".");

  const iv = Buffer.from(ivBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");
  const encrypted = Buffer.from(encryptedBase64, "base64");

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    aesSecretKey,
    iv
  ) as crypto.DecipherGCM;

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

// ─── Two-Factor Token ─────────────────────────────────────────────────────────

export const generateTwoFactorToken = async (email: string) => {
  const token = crypto.randomInt(100_000, 1_000_000).toString();
  const expires = new Date(new Date().getTime() + 5 * 60 * 1000);

  const existingToken = await getTwoFactorTokenByEmail(email);
  if (existingToken) {
    await db.twoFactorToken.delete({ where: { id: existingToken.id } });
  }

  const twoFactorToken = await db.twoFactorToken.create({
    data: { email, token, expires },
  });

  return twoFactorToken;
};

// ─── Password Reset Token ─────────────────────────────────────────────────────

export const generatePasswordResetToken = async (email: string) => {
  const tokenId = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 heure

  const payload = { email, tokenId, expires: expires.toISOString() };
  const signedToken = sign(payload, privateKey, {
    algorithm: ALGORITHM,
    expiresIn: "1h",
  });

  const encryptedToken = aesEncrypt(signedToken);

  // Remplacer l'ancien token s'il existe
  const existingToken = await getPasswordResetTokenByEmail(email);
  if (existingToken) {
    await db.passwordResetToken.delete({ where: { id: existingToken.id } });
  }

  await db.passwordResetToken.create({
    data: { email, token: encryptedToken, expires, tokenId },
  });

  return encryptedToken;
};

export const verifyPasswordResetToken = async (encryptedToken: string) => {
  try {
    const decryptedToken = aesDecrypt(encryptedToken);
    const decodedToken = verify(decryptedToken, publicKey, {
      algorithms: ["RS256"],
    });
    return { tokenPayload: decodedToken };
  } catch (error: unknown) {
    if (error instanceof TokenExpiredError) {
      return { error: "Token expiré" };
    }
    console.error("Erreur lors de la vérification du token :", error);
    return { error: "Token invalide" };
  }
};

// ─── Email Verification Token ─────────────────────────────────────────────────

export const generateVerificationToken = async (email: string) => {
  const tokenId = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 heure

  const payload = { email, tokenId, expires: expires.toISOString() };
  const signedToken = sign(payload, privateKey, {
    algorithm: ALGORITHM,
    expiresIn: "1h",
  });

  const encryptedToken = aesEncrypt(signedToken);

  const existingToken = await getVerificationTokenByEmail(email);
  if (existingToken) {
    await db.verificationToken.delete({ where: { id: existingToken.id } });
  }

  await db.verificationToken.create({
    data: { email, token: encryptedToken, expires, tokenId },
  });

  return encryptedToken;
};

export const verifyVerificationToken = async (encryptedToken: string) => {
  try {
    const decryptedToken = aesDecrypt(encryptedToken);
    const decodedToken = verify(decryptedToken, publicKey, {
      algorithms: [ALGORITHM],
    });
    return { tokenPayload: decodedToken };
  } catch (error: unknown) {
    if (error instanceof TokenExpiredError) {
      return { error: "Token expiré" };
    }
    console.error("Erreur lors de la vérification du token :", error);
    return { error: "Token invalide" };
  }
};

// ─── Verification Token (changement d'email) ──────────────────────────────────

export const generateVerificationTokenForModifyEmail = async (
  email: string,
  userId: string
) => {
  const tokenId = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 heure

  const payload = { email, tokenId, expires: expires.toISOString(), userId };
  const signedToken = sign(payload, privateKey, {
    algorithm: ALGORITHM,
    expiresIn: "1h",
  });

  const encryptedToken = aesEncrypt(signedToken);

  const existingToken = await getVerificationTokenByEmail(email);
  if (existingToken) {
    await db.verificationToken.delete({ where: { id: existingToken.id } });
  }

  await db.verificationToken.create({
    data: { email, token: encryptedToken, expires, tokenId, userId },
  });

  return encryptedToken;
};

// ─── Access JWT (session) ─────────────────────────────────────────────────────

/** Crée un JWT signé RSA puis chiffré AES-256-GCM. */
export const createEncryptedJWT = (payload: object, expiresIn: string): string => {
  const token = sign(payload, privateKey, {
    algorithm: ALGORITHM,
    expiresIn: expiresIn as unknown as number,
  });
  return aesEncrypt(token);
};

/** Déchiffre et vérifie un JWT produit par createEncryptedJWT(). */
export const verifyEncryptedJWT = (encryptedToken: string): JwtPayload | string => {
  const decryptedToken = aesDecrypt(encryptedToken);
  return verify(decryptedToken, publicKey, { algorithms: ["RS256"] });
};

/** Extrait l'userId depuis un JWT d'accès chiffré. Retourne null si invalide ou révoqué. */
export async function getUserIdFromToken(token: string): Promise<string | null> {
  return (await verifyAccessToken(token))?.userId ?? null;
}

export interface TokenPayload extends JwtPayload {
  userId: string;
  /** Id de la session en base : permet la révocation (déconnexion, désactivation du compte). */
  sid?: string;
  email?: string;
  isImpersonation?: boolean;
  impersonatedBy?: string;
  /** Présent uniquement sur les tokens à usage restreint (ex. "2fa_challenge"). */
  purpose?: string;
}

/**
 * Déchiffre et vérifie un JWT d'accès (session ou impersonation), retourne le payload complet.
 * Les tokens à usage restreint (champ `purpose`, ex. challenge 2FA) sont refusés :
 * ils ne doivent jamais donner accès aux routes protégées.
 */
export function getFullTokenPayload(token: string): TokenPayload | null {
  try {
    const decoded = verifyEncryptedJWT(token);
    if (typeof decoded === "object" && (decoded as JwtPayload).userId) {
      const payload = decoded as TokenPayload;
      if (payload.purpose !== undefined) return null;
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Vérifie un JWT d'accès ET son état en base :
 * - la session référencée par `sid` existe toujours et n'est pas expirée ;
 * - le compte est actif et non supprimé.
 * À utiliser pour toute authentification de requête (la vérification cryptographique seule
 * ne permet pas de révoquer un token avant son expiration).
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  const payload = getFullTokenPayload(token);
  if (!payload?.sid) return null;

  try {
    const session = await db.session.findFirst({
      where: {
        id: payload.sid,
        userId: payload.userId,
        isDeleted: false,
        refreshTokenExpires: { gt: new Date() },
        user: { isActive: true, isDeleted: false },
      },
      select: { id: true },
    });
    return session ? payload : null;
  } catch (error) {
    console.error("Erreur lors de la vérification de la session :", error);
    return null;
  }
}

/**
 * Déchiffre et vérifie un token à usage restreint.
 * Retourne null si le token est invalide ou si son `purpose` ne correspond pas.
 */
export function getPurposeTokenPayload(
  token: string,
  purpose: string
): TokenPayload | null {
  try {
    const decoded = verifyEncryptedJWT(token);
    if (typeof decoded === "object" && (decoded as JwtPayload).userId) {
      const payload = decoded as TokenPayload;
      return payload.purpose === purpose ? payload : null;
    }
    return null;
  } catch {
    return null;
  }
}
