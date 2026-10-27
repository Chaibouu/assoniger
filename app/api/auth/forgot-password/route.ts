import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { generatePasswordResetToken } from "@/lib/tokens";
import { getUserByEmail } from "@/data/user";
import { sendPasswordResetEmail } from "@/lib/mail";
import { PasswordResetSchema } from "@/schemas";
import { rateLimitRedisEmailTarget } from "@/lib/rateLimit";

// Réponse identique que le compte existe ou non (pas d'énumération des comptes)
const GENERIC_MESSAGE =
  "Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Vérifier si l'email est fourni
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }
    // Validation des données avec Zod
    const parsedData = PasswordResetSchema.safeParse({ email });

    // Si la validation échoue, renvoyer les erreurs de Zod
    if (!parsedData.success) {
      return NextResponse.json(
        {
          error: parsedData.error.issues
            .map((issue) => issue.message)
            .join(", "),
        },
        { status: 400 }
      );
    }

    // Anti email-bombing par adresse destinataire. Pas de limite par IP ici : la route est
    // appelée par une Server Action, donc depuis le serveur (même IP pour tous les utilisateurs).
    const rlResponse = await rateLimitRedisEmailTarget(parsedData.data.email);
    if (rlResponse) return rlResponse;

    // Recherche de l'utilisateur par email
    const user = await getUserByEmail(parsedData.data.email);

    // Envoi uniquement pour un compte existant et non désactivé par l'administrateur
    if (user && (user.isActive || !user.emailVerified)) {
      // Générer un token de réinitialisation sécurisé
      const resetToken = await generatePasswordResetToken(user.email as string);

      // Envoyer un email avec le lien de réinitialisation de mot de passe
      await sendPasswordResetEmail(user.email as string, resetToken);
    }

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation du mot de passe :",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
