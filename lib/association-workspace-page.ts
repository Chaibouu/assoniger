import { getUser } from "@/actions/getUser";
import { associationWorkspaceOverviewHref } from "@/lib/association-overview-href";
import {
  associationWorkspaceBackLink,
  resolveAssociationWorkspaceBasePath,
} from "@/lib/association-workspace-paths";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";

/** Contexte commun pour les pages membres / adhésion / documents / candidat. */
export async function loadAssociationWorkspacePageContext(associationId: string) {
  const auth = await getUser();
  const sessionUser = auth?.user?.user;

  const association = await db.association.findFirst({
    where: { id: associationId, isDeleted: false },
    select: { id: true, name: true, userId: true },
  });
  if (!association) notFound();

  const ficheHref = await resolveAssociationWorkspaceBasePath(associationId);
  const back = associationWorkspaceBackLink(
    sessionUser?.role,
    sessionUser?.id,
    association.userId
  );
  const overviewHref = associationWorkspaceOverviewHref(
    sessionUser?.role,
    sessionUser?.id,
    association.userId
  );

  return { association, ficheHref, back, overviewHref };
}
