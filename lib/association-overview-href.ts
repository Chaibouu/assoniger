import { UserRole } from "@prisma/client";

/** Lien « maison » vers le profil / espace association (titulaire du compte uniquement). */
export function associationWorkspaceOverviewHref(
  viewerRole: string | undefined,
  viewerId: string | undefined,
  associationUserId: string | null | undefined
): string | undefined {
  if (viewerRole !== UserRole.ASSOCIATION || !viewerId || !associationUserId) return undefined;
  if (associationUserId !== viewerId) return undefined;
  return "/dashboard/profile";
}
