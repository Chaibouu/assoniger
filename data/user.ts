import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const getUserByEmail = async (email: string) => {
  try {
    const normalized = email.trim();
    if (!normalized) return null;

    return await db.user.findFirst({
      where: {
        email: { equals: normalized, mode: "insensitive" },
        isDeleted: false,
      },
    });
  } catch {
    return null;
  }
};

// export const getUserById = async (id: string) => {
//   try {
//     const user = await db.user.findUnique({ where: { id } });

//     return user;
//   } catch {
//     return null;
//   }
// };

export async function getAllUsers() {
  try {
    return await db.user.findMany({
      where: { isDeleted: false },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        image: true,
      },
      orderBy: { role: "asc" },
    });
  } catch {
    return [];
  }
}

export async function getUserById(userId: string) {
  try {
    // Récupérer les informations de l'utilisateur depuis la base de données
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        image: true,
      },
    });

    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }

    return user;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return null;
  }
}

const dashboardProfileSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  isActive: true,
  image: true,
  emailVerified: true,
  isTwoFactorEnabled: true,
  managedAssociations: {
    where: { isDeleted: false },
    take: 1,
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      name: true,
      acronym: true,
      slogan: true,
      status: true,
      contactEmail: true,
      contactPhone: true,
      contactWhatsapp: true,
      address: true,
      website: true,
      legalStatus: true,
      logoUrl: true,
      createdAt: true,
      region: { select: { name: true, code: true } },
      departement: { select: { name: true, code: true } },
      commune: { select: { name: true, code: true } },
    },
  },
} satisfies Prisma.UserSelect;

export type DashboardProfileUser = Prisma.UserGetPayload<{ select: typeof dashboardProfileSelect }>;

/** Profil étendu pour la page « Mon profil » du tableau de bord (compte + association gérée le cas échéant). */
export async function getDashboardProfileByUserId(
  userId: string
): Promise<DashboardProfileUser | null> {
  try {
    return await db.user.findFirst({
      where: { id: userId, isDeleted: false },
      select: dashboardProfileSelect,
    });
  } catch (error) {
    console.error("[getDashboardProfileByUserId]", error);
    return null;
  }
}
