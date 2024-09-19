import { db } from "@/lib/db";

export const getVerificationTokenByToken = async (tokenId: string) => {
  try {
    const verificationToken = await db.verificationToken.findUnique({
      where: { tokenId }, // Cherche par tokenId et non par le token complet
    });

    return verificationToken;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération du token de vérification :",
      error
    );
    return null;
  }
};

export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await db.verificationToken.findFirst({
      where: { email },
    });

    return verificationToken;
  } catch {
    return null;
  }
};
