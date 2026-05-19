import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import type { AssociationWorkspaceSection } from "@/lib/association-workspace-paths";
import { associationSectionPath } from "@/lib/association-workspace-paths";

/** Redirige l’index d’une section vers `/{section}/{associationId}` ou une liste adaptée au rôle. */
export async function redirectAssociationSectionIndex(
  segment: AssociationWorkspaceSection
): Promise<void> {
  const result = await getUser();
  const user = result?.user?.user;
  if (!user?.id) redirect("/auth/login");

  if (user.role === UserRole.ASSOCIATION) {
    const assoc = await db.association.findFirst({
      where: { userId: user.id, isDeleted: false },
      select: { id: true },
    });
    if (assoc) redirect(associationSectionPath(assoc.id, segment));
    redirect("/dashboard/profile");
  }

  redirect("/dashboard/associations");
}
