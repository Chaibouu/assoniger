"use server";

import { revalidatePath } from "next/cache";
import { AssociationStatus, UserRole } from "@prisma/client";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import { logAdminHistory } from "@/lib/admin-history";

function isModerationStaff(role: UserRole) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.MODERATOR
  );
}

export type PendingModerationResult = { ok: true } | { ok: false; error: string };

/** Valide un dossier PENDING : passage en VERIFIED + activation du compte utilisateur lié. */
export async function approvePendingAssociation(
  associationId: string
): Promise<PendingModerationResult> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) return { ok: false, error: "Non authentifié" };
  if (!isModerationStaff(user.role as UserRole)) return { ok: false, error: "Accès refusé" };

  const a = await db.association.findFirst({
    where: { id: associationId, isDeleted: false, status: AssociationStatus.PENDING },
    select: { id: true, userId: true, name: true },
  });
  if (!a) return { ok: false, error: "Dossier introuvable ou déjà traité" };

  await db.association.update({
    where: { id: associationId },
    data: {
      status: AssociationStatus.VERIFIED,
      verifiedById: user.id,
      verifiedAt: new Date(),
      rejectedReason: null,
    },
  });

  if (a.userId) {
    await db.user.update({
      where: { id: a.userId },
      data: { isActive: true, emailVerified: new Date() },
    });
  }

  await logAdminHistory({
    userId: user.id,
    action: "ASSOCIATION_APPROVE_PENDING",
    target: "Association",
    targetId: associationId,
    metadata: { name: a.name },
  });

  revalidatePath("/dashboard/associations/pending");
  revalidatePath(`/dashboard/associations/pending/${associationId}`);
  revalidatePath("/dashboard/associations");
  revalidatePath(`/dashboard/associations/${associationId}`);

  return { ok: true };
}

/** Refuse un dossier PENDING avec une raison enregistrée. */
export async function rejectPendingAssociation(
  associationId: string,
  reason: string
): Promise<PendingModerationResult> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) return { ok: false, error: "Non authentifié" };
  if (!isModerationStaff(user.role as UserRole)) return { ok: false, error: "Accès refusé" };

  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    return { ok: false, error: "La raison du refus doit contenir au moins 3 caractères" };
  }

  const a = await db.association.findFirst({
    where: { id: associationId, isDeleted: false, status: AssociationStatus.PENDING },
    select: { id: true, name: true },
  });
  if (!a) return { ok: false, error: "Dossier introuvable ou déjà traité" };

  await db.association.update({
    where: { id: associationId },
    data: {
      status: AssociationStatus.REJECTED,
      rejectedReason: trimmed,
      verifiedById: user.id,
      verifiedAt: new Date(),
    },
  });

  await logAdminHistory({
    userId: user.id,
    action: "ASSOCIATION_REJECT_PENDING",
    target: "Association",
    targetId: associationId,
    metadata: { name: a.name },
  });

  revalidatePath("/dashboard/associations/pending");
  revalidatePath(`/dashboard/associations/pending/${associationId}`);
  revalidatePath("/dashboard/associations");
  revalidatePath(`/dashboard/associations/${associationId}`);

  return { ok: true };
}
