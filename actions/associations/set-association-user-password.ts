"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { revalidateAssociationWorkspaceRoot } from "@/lib/association-workspace-paths";

const passwordFormSchema = z
  .object({
    newPassword: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères")),
    confirmPassword: z.string().transform((s) => s.trim()),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

function isModerationStaff(role: unknown): role is UserRole {
  return (
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MODERATOR
  );
}

function canSetPasswordForUser(actorRole: UserRole, actorId: string, managedUserId: string) {
  if (isModerationStaff(actorRole)) {
    return true;
  }
  if (actorRole === UserRole.ASSOCIATION && actorId === managedUserId) {
    return true;
  }
  return false;
}

export type SetAssociationUserPasswordResult = { ok: true } | { ok: false; error: string };

/** Définit un nouveau mot de passe pour le compte utilisateur lié à l’association (admin / modérateur ou le compte lui-même). */
export async function setAssociationManagedUserPassword(
  formData: FormData
): Promise<SetAssociationUserPasswordResult> {
  const associationId = String(formData.get("associationId") ?? "").trim();
  if (!associationId) return { ok: false, error: "Association invalide" };

  try {
    const result = await getUser();
    const actor = result?.user?.user;
    if (!actor?.id) return { ok: false, error: "Non authentifié" };

    const actorRole = actor.role as UserRole;

    const parsed = passwordFormSchema.safeParse({
      newPassword: String(formData.get("newPassword") ?? ""),
      confirmPassword: String(formData.get("confirmPassword") ?? ""),
    });

    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const msg =
        first.newPassword?.[0] ??
        first.confirmPassword?.[0] ??
        parsed.error.errors[0]?.message ??
        "Données invalides";
      return { ok: false, error: msg };
    }

    const assoc = await db.association.findFirst({
      where: { id: associationId, isDeleted: false },
      select: { userId: true },
    });

    if (!assoc?.userId) {
      return { ok: false, error: "Aucun compte utilisateur n’est lié à cette association." };
    }

    if (!canSetPasswordForUser(actorRole, actor.id, assoc.userId)) {
      return { ok: false, error: "Vous n’avez pas le droit de modifier ce mot de passe." };
    }

    const target = await db.user.findFirst({
      where: { id: assoc.userId, isDeleted: false },
      select: { id: true, password: true },
    });
    if (!target) return { ok: false, error: "Utilisateur introuvable." };

    const currentPasswordInput = String(formData.get("currentPassword") ?? "").trim();
    const mustVerifyCurrent =
      !isModerationStaff(actorRole) && actor.id === assoc.userId && Boolean(target.password);

    if (mustVerifyCurrent) {
      if (!currentPasswordInput) {
        return { ok: false, error: "Saisissez l’ancien mot de passe." };
      }
      const currentOk = await bcrypt.compare(currentPasswordInput, target.password as string);
      if (!currentOk) {
        return { ok: false, error: "L’ancien mot de passe est incorrect." };
      }
    }

    const plain = parsed.data.newPassword;
    const hashed = await bcrypt.hash(plain, 10);

    await db.user.update({
      where: { id: assoc.userId },
      data: { password: hashed },
    });

    // Mot de passe défini par la modération : les sessions ouvertes du compte sont fermées
    if (actor.id !== assoc.userId) {
      await db.session.deleteMany({ where: { userId: assoc.userId } });
    }

    revalidateAssociationWorkspaceRoot(associationId);
    revalidatePath("/dashboard/associations");
    return { ok: true };
  } catch (e) {
    console.error("[setAssociationManagedUserPassword]", e);
    return {
      ok: false,
      error: "Une erreur est survenue lors de l’enregistrement. Réessayez ou contactez un administrateur.",
    };
  }
}
