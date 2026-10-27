"use server";

import { LoginSchema } from "@/schemas";
import { callRoute } from "@/lib/internal-route";
import {
  clearTwoFactorChallenge,
  readTwoFactorChallenge,
  setSessionCookies,
  setTwoFactorChallenge,
} from "@/lib/auth-cookies";
import { POST as loginRoute } from "@/app/api/auth/login/route";
import { POST as twoFactorLoginRoute } from "@/app/api/auth/2fa/login/route";

type LoginRouteResponse = {
  error?: string;
  accessToken?: string;
  refreshToken?: string;
  requires2FA?: boolean;
  tempToken?: string;
};

export const login = async (data: {
  email: string;
  password: string;
  rememberMe?: boolean;
}) => {
  // Valider les données avec Zod
  const validatedData = LoginSchema.safeParse(data);

  if (!validatedData.success) {
    return {
      error: validatedData.error.issues
        .map((issue) => issue.message)
        .join(", "),
    };
  }

  const { email, password, rememberMe } = validatedData.data;

  try {
    // Appel direct de la route login (IP réelle du visiteur transmise)
    const { ok, data: result } = await callRoute<LoginRouteResponse>(
      loginRoute,
      "/api/auth/login",
      { body: { email, password, rememberMe } }
    );

    if (!ok) {
      // Afficher l'erreur envoyée par le backend
      return { error: result.error || "Erreur lors de la connexion" };
    }

    // 2FA activée : le token de challenge reste côté serveur (cookie httpOnly 5 min)
    if (result.requires2FA && result.tempToken) {
      await setTwoFactorChallenge(result.tempToken, Boolean(rememberMe));
      return { requires2FA: true as const };
    }

    if (!result.accessToken || !result.refreshToken) {
      return { error: "Erreur lors de la connexion" };
    }

    await setSessionCookies(result.accessToken, result.refreshToken, Boolean(rememberMe));
    return { success: "Connexion réussie" };
  } catch (error) {
    console.error("Erreur dans loginAction:", error);
    return { error: "Erreur serveur" };
  }
};

/** Deuxième étape de connexion : vérifie le code de l'application d'authentification. */
export const verifyTwoFactorLogin = async (code: string) => {
  const normalizedCode = String(code ?? "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) {
    return { error: "Le code doit contenir 6 chiffres." };
  }

  const { tempToken, rememberMe } = await readTwoFactorChallenge();
  if (!tempToken) {
    return {
      error: "La vérification a expiré. Veuillez vous reconnecter.",
      expired: true as const,
    };
  }

  try {
    const { ok, status, data: result } = await callRoute<LoginRouteResponse>(
      twoFactorLoginRoute,
      "/api/auth/2fa/login",
      { body: { tempToken, code: normalizedCode, rememberMe } }
    );

    if (!ok) {
      // Challenge expiré ou invalide : il faut recommencer depuis l'email / mot de passe
      if (status === 401 && !result.error?.startsWith("Code invalide")) {
        await clearTwoFactorChallenge();
        return {
          error: "La vérification a expiré. Veuillez vous reconnecter.",
          expired: true as const,
        };
      }
      return { error: result.error || "Code invalide" };
    }

    if (!result.accessToken || !result.refreshToken) {
      return { error: "Erreur lors de la connexion" };
    }

    await clearTwoFactorChallenge();
    await setSessionCookies(result.accessToken, result.refreshToken, rememberMe);
    return { success: "Connexion réussie" };
  } catch (error) {
    console.error("Erreur dans verifyTwoFactorLogin:", error);
    return { error: "Erreur serveur" };
  }
};

/** Abandon de l'étape 2FA (retour au formulaire email / mot de passe). */
export const cancelTwoFactorLogin = async () => {
  await clearTwoFactorChallenge();
};
