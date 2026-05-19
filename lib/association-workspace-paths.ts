import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";

export type AssociationWorkspaceSection =
  | "membres"
  | "documents"
  | "demandes-adhesion"
  | "candidats";

export function adminAssociationWorkspacePath(associationId: string): string {
  return `/dashboard/associations/${associationId}`;
}

export function profileAssociationWorkspacePath(associationId: string): string {
  return `/dashboard/profile/associations/${associationId}`;
}

export function membresAssociationPath(associationId: string): string {
  return `/dashboard/membres-association/${associationId}`;
}

export function adhesionAssociationPath(associationId: string): string {
  return `/dashboard/adhesion-association/${associationId}`;
}

export function documentsAssociationPath(associationId: string): string {
  return `/dashboard/documents-association/${associationId}`;
}

export function candidatAssociationPath(associationId: string): string {
  return `/dashboard/candidat-association/${associationId}`;
}

export function associationSectionPath(
  associationId: string,
  segment: AssociationWorkspaceSection
): string {
  switch (segment) {
    case "membres":
      return membresAssociationPath(associationId);
    case "demandes-adhesion":
      return adhesionAssociationPath(associationId);
    case "documents":
      return documentsAssociationPath(associationId);
    case "candidats":
      return candidatAssociationPath(associationId);
  }
}

function isStaffRole(role: string | undefined): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MODERATOR;
}

/**
 * Préfixe d’URL pour la fiche association.
 * Titulaire → `/dashboard/profile/associations/{id}` ; staff → `/dashboard/associations/{id}`.
 */
export async function resolveAssociationWorkspaceBasePath(associationId: string): Promise<string> {
  const result = await getUser();
  const user = result?.user?.user;
  if (user?.role === UserRole.ASSOCIATION) {
    const assoc = await db.association.findFirst({
      where: { id: associationId, isDeleted: false },
      select: { userId: true },
    });
    if (assoc?.userId === user.id) {
      return profileAssociationWorkspacePath(associationId);
    }
  }
  return adminAssociationWorkspacePath(associationId);
}

/** Lien retour selon titulaire association ou staff. */
export function associationWorkspaceBackLink(
  viewerRole: string | undefined,
  viewerId: string | undefined,
  associationUserId: string | null | undefined
): { href: string; label: string } {
  if (
    viewerRole === UserRole.ASSOCIATION &&
    viewerId &&
    associationUserId &&
    associationUserId === viewerId
  ) {
    return { href: "/dashboard/profile", label: "Retour à mon espace" };
  }
  return { href: "/dashboard/associations", label: "Retour à la liste" };
}

/** Titulaire sur fiche admin → fiche profil. */
export async function redirectAssociationOwnerFromAdminFiche(associationId: string): Promise<void> {
  const ficheHref = await resolveAssociationWorkspaceBasePath(associationId);
  if (ficheHref !== adminAssociationWorkspacePath(associationId)) {
    redirect(ficheHref);
  }
}

/** Anciennes URLs imbriquées → routes dédiées. */
export async function redirectLegacyAssociationSection(
  associationId: string,
  segment: AssociationWorkspaceSection
): Promise<void> {
  redirect(associationSectionPath(associationId, segment));
}

/** Titulaire sur `/dashboard/profile/associations/.../membres` etc. → route dédiée. */
export async function redirectProfileAssociationNestedSection(
  associationId: string,
  segment: AssociationWorkspaceSection
): Promise<void> {
  const result = await getUser();
  const user = result?.user?.user;
  if (!user?.id) redirect("/auth/login");

  if (isStaffRole(user.role)) {
    redirect(associationSectionPath(associationId, segment));
  }

  if (user.role !== UserRole.ASSOCIATION) {
    redirect("/unauthorized");
  }

  const assoc = await db.association.findFirst({
    where: { id: associationId, isDeleted: false },
    select: { userId: true },
  });
  if (!assoc?.userId || assoc.userId !== user.id) {
    redirect("/unauthorized");
  }

  redirect(associationSectionPath(associationId, segment));
}

/** Staff sur fiche profil dédiée au titulaire → fiche admin. */
export async function redirectStaffFromProfileAssociationWorkspace(
  associationId: string
): Promise<void> {
  const result = await getUser();
  const user = result?.user?.user;
  if (!user?.id) redirect("/auth/login");
  if (!isStaffRole(user.role)) return;

  const assoc = await db.association.findFirst({
    where: { id: associationId, isDeleted: false },
    select: { userId: true },
  });
  if (!assoc) notFound();

  redirect(adminAssociationWorkspacePath(associationId));
}

/** Titulaire uniquement sur fiche profil ; staff → fiche admin. */
export async function assertProfileAssociationWorkspace(associationId: string): Promise<void> {
  const result = await getUser();
  const user = result?.user?.user;
  if (!user?.id) redirect("/auth/login");

  if (isStaffRole(user.role)) {
    await redirectStaffFromProfileAssociationWorkspace(associationId);
  }

  if (user.role !== UserRole.ASSOCIATION) {
    redirect("/unauthorized");
  }

  const assoc = await db.association.findFirst({
    where: { id: associationId, isDeleted: false },
    select: { userId: true },
  });
  if (!assoc?.userId || assoc.userId !== user.id) {
    redirect("/unauthorized");
  }
}

export function revalidateAssociationWorkspaceSegment(
  associationId: string,
  segment: AssociationWorkspaceSection
): void {
  revalidatePath(associationSectionPath(associationId, segment));
  revalidatePath(`${adminAssociationWorkspacePath(associationId)}/${segment}`);
  revalidatePath(`${profileAssociationWorkspacePath(associationId)}/${segment}`);
}

export function revalidateAssociationWorkspaceRoot(associationId: string): void {
  revalidatePath(adminAssociationWorkspacePath(associationId));
  revalidatePath(profileAssociationWorkspacePath(associationId));
  revalidatePath("/dashboard/profile");
}
