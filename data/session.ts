import { db } from "@/lib/db";

import type { Prisma } from "@prisma/client";

// Correction de la fonction avec typage adéquat
// `id` optionnel : fourni quand le JWT d'accès doit référencer la session (champ `sid`)
export const createSession = async (sessionData: Prisma.SessionUncheckedCreateInput) => {
  return await db.session.create({
    data: sessionData,
  });
};

// Supprimer une session utilisateur
export const deleteSession = async (sessionToken: string) => {
  return await db.session.deleteMany({ where: { sessionToken } });
};

// Récupérer une session par token de rafraîchissement
export const getSessionByRefreshToken = async (refreshToken: string) => {
  return await db.session.findUnique({ where: { refreshToken } });
};
