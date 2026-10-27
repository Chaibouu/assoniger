import { db } from "@/lib/db";
import { getUser } from "@/actions/getUser";
import { notFound, redirect } from "next/navigation";
import { UserRole, AssociationStatus } from "@prisma/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import appConfig from "@/settings";
import { AssociationDetailToolbar } from "@/components/dashboard/AssociationDetailToolbar";
import { AssociationWorkspaceNav, type AssociationWorkspaceTabId } from "@/components/dashboard/AssociationWorkspaceNav";
import { associationWorkspaceOverviewHref } from "@/lib/association-overview-href";
import {
  adminAssociationWorkspacePath,
  adminMembresPath,
  adminAdhesionPath,
  adminDocumentsPath,
  adminCandidatsPath,
} from "@/lib/association-workspace-paths";
import type { ReactNode } from "react";

const statusLabel: Record<AssociationStatus, string> = {
  PENDING: "En attente",
  VERIFIED: "Vérifiée",
  ACTIVE: "Active",
  REJECTED: "Rejetée",
  SUSPENDED: "Suspendue",
  INACTIVE: "Inactive",
  DELETED: "Supprimée",
};

const shellSelect = {
  id: true,
  name: true,
  acronym: true,
  status: true,
  userId: true,
  createdAt: true,
  user: { select: { email: true, password: true } },
} as const;

export async function AssociationAdminShell({
  associationId,
  active,
  children,
}: {
  associationId: string;
  active: AssociationWorkspaceTabId;
  children: ReactNode;
}) {
  const result = await getUser();
  const currentUser = result?.user?.user;

  if (!currentUser) redirect("/auth/login");

  const isModerationStaff =
    currentUser.role === UserRole.ADMIN ||
    currentUser.role === UserRole.SUPER_ADMIN ||
    currentUser.role === UserRole.MODERATOR;

  if (!isModerationStaff) redirect("/unauthorized");

  const association = await db.association.findFirst({
    where: { id: associationId, isDeleted: false },
    select: shellSelect,
  });

  if (!association) notFound();

  const ficheHref = adminAssociationWorkspacePath(associationId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <AssociationDetailToolbar
        associationId={association.id}
        associationName={association.name}
        status={association.status}
        hasLinkedUser={!!association.userId}
        linkedUserEmail={association.user?.email ?? null}
        requireCurrentPassword={false}
        canFullEdit={currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN}
        canUseToolbar={true}
        canToggleStatus={true} // vue réservée à la modération (redirection plus haut sinon)
        showPendingDossier={association.status === AssociationStatus.PENDING}
        isEditMode={false}
      />

      <AssociationWorkspaceNav
        associationId={association.id}
        active={active}
        ficheHref={ficheHref}
        overviewHref={associationWorkspaceOverviewHref(
          currentUser.role,
          currentUser.id,
          association.userId
        )}
        sectionHrefs={{
          membres: adminMembresPath(association.id),
          demandes: adminAdhesionPath(association.id),
          documents: adminDocumentsPath(association.id),
          candidats: adminCandidatsPath(association.id),
        }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Link
          href="/dashboard/associations"
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Retour à la liste
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: appConfig.primaryColor }} aria-hidden />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {association.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {association.acronym || "Sans sigle"} · Créée le{" "}
              {new Date(association.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}
            </p>
            {association.userId ? (
              <p className="text-xs text-muted-foreground">
                Compte lié :{" "}
                <span className="font-mono text-foreground">
                  {association.user?.email ?? association.userId}
                </span>
              </p>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-200">Aucun compte utilisateur lié.</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 self-start border px-3 py-1 text-xs font-semibold",
              association.status === AssociationStatus.ACTIVE &&
                "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
              association.status === AssociationStatus.PENDING &&
                "border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
              association.status === AssociationStatus.INACTIVE && "border-muted-foreground/40",
              (association.status === AssociationStatus.REJECTED ||
                association.status === AssociationStatus.SUSPENDED) &&
                "border-destructive/35 bg-destructive/10 text-destructive"
            )}
          >
            {statusLabel[association.status]}
          </Badge>
        </div>
      </section>

      {children}
    </div>
  );
}
