"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AssociationStatus, Prisma, UserRole } from "@prisma/client";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";

async function assertCanManageAssociation(associationId: string) {
  const result = await getUser();
  const user = result?.user?.user;
  if (!user) redirect("/auth/login");

  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.SUPER_ADMIN &&
    user.role !== UserRole.MODERATOR &&
    user.role !== UserRole.ASSOCIATION
  ) {
    redirect("/unauthorized");
  }

  const association = await db.association.findFirst({
    where: { ...( { id: associationId, isDeleted: false } as Prisma.AssociationWhereInput) },
    select: { id: true, userId: true },
  });

  if (!association) return null;

  if (user.role === UserRole.ASSOCIATION && association.userId !== user.id) {
    redirect("/unauthorized");
  }

  return { user };
}

function isModerationStaff(role: UserRole) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.MODERATOR
  );
}

export async function deleteAssociationAction(formData: FormData) {
  const associationId = String(formData.get("associationId") ?? "");
  if (!associationId) return;

  const ctx = await assertCanManageAssociation(associationId);
  if (!ctx) return;

  await db.association.update({
    where: { id: associationId },
    data: {
      ...( {
        isDeleted: true,
        deletedAt: new Date(),
        status: AssociationStatus.DELETED,
      } as Prisma.AssociationUpdateInput),
    },
  });

  revalidatePath("/dashboard/associations");
  revalidatePath(`/dashboard/associations/${associationId}`);
  revalidatePath("/dashboard/associations/pending");
  redirect("/dashboard/associations");
}

export async function toggleAssociationStatusAction(formData: FormData) {
  const associationId = String(formData.get("associationId") ?? "");
  if (!associationId) return;

  const ctx = await assertCanManageAssociation(associationId);
  if (!ctx) return;

  // Le changement de statut relève de la modération : une association ne peut pas s'activer elle-même.
  if (!isModerationStaff(ctx.user.role as UserRole)) {
    redirect("/unauthorized");
  }

  const association = await db.association.findFirst({
    where: { ...( { id: associationId, isDeleted: false } as Prisma.AssociationWhereInput) },
    select: { id: true, status: true },
  });

  if (!association) return;

  const nextStatus =
    association.status === AssociationStatus.ACTIVE
      ? AssociationStatus.INACTIVE
      : AssociationStatus.ACTIVE;

  await db.association.update({
    where: { id: associationId },
    data: { status: nextStatus },
  });

  revalidatePath("/dashboard/associations");
  revalidatePath(`/dashboard/associations/${associationId}`);
  revalidatePath("/dashboard/associations/pending");
}