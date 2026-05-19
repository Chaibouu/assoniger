import { redirect, notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";

export type AssociationManagementContext = {
  user: { id: string; role: UserRole };
  association: { id: string; name: string; userId: string | null; status: string };
};

/** Admin / super-admin ou titulaire du compte association lié à la fiche. */
export async function assertAssociationManagementAccess(
  associationId: string
): Promise<AssociationManagementContext> {
  const result = await getUser();
  const user = result?.user?.user;
  if (!user?.id) redirect("/auth/login");

  const assoc = await db.association.findFirst({
    where: { id: associationId, isDeleted: false },
    select: { id: true, name: true, userId: true, status: true },
  });
  if (!assoc) notFound();

  const staff =
    user.role === UserRole.ADMIN ||
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.MODERATOR;
  const owner = user.role === UserRole.ASSOCIATION && assoc.userId === user.id;

  if (!staff && !owner) redirect("/unauthorized");

  return {
    user: { id: user.id, role: user.role as UserRole },
    association: assoc,
  };
}
