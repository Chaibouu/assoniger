import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";
import { ResendVerificationSchema } from "@/schemas";
import { rateLimitRedisEmailTarget } from "@/lib/rateLimit";

// Réponse identique que le compte existe ou non (pas d'énumération des comptes)
const GENERIC_MESSAGE =
  "Si un compte non vérifié existe pour cette adresse, un nouvel email de vérification a été envoyé.";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "L'adresse email est requise" },
        { status: 400 }
      );
    }
    // Validation des données avec Zod
    const parsedData = ResendVerificationSchema.safeParse({ email });
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

    // Envoi uniquement pour un compte existant, jamais vérifié
    // (un compte désactivé par l'administrateur a déjà un email vérifié)
    if (user && !user.emailVerified) {
      const verificationToken = await generateVerificationToken(
        user.email as string
      );
      await sendVerificationEmail(user.email as string, verificationToken);
    }

    return NextResponse.json({ message: GENERIC_MESSAGE }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de vérification :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
