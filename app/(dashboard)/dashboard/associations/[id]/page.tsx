import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import appConfig from "@/settings";
import { AssociationDetailToolbar } from "@/components/dashboard/AssociationDetailToolbar";
import { AssociationFicheDetail } from "@/components/dashboard/AssociationFicheDetail";
import type { AssociationFicheModel } from "@/components/dashboard/AssociationFicheDetail";
import { AssociationWorkspaceNav } from "@/components/dashboard/AssociationWorkspaceNav";
import { associationWorkspaceOverviewHref } from "@/lib/association-overview-href";
import {
  redirectAssociationOwnerFromAdminFiche,
  resolveAssociationWorkspaceBasePath,
} from "@/lib/association-workspace-paths";
import { AssociationStatus, UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AssociationDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{
    mode?: string;
  }>;
};

const statusLabel: Record<AssociationStatus, string> = {
  PENDING: "En attente",
  VERIFIED: "Vérifiée",
  ACTIVE: "Active",
  REJECTED: "Rejetée",
  SUSPENDED: "Suspendue",
  INACTIVE: "Inactive",
  DELETED: "Supprimée",
};

const associationDetailSelect = {
  id: true,
  name: true,
  acronym: true,
  slogan: true,
  description: true,
  logoUrl: true,
  coverImageUrl: true,
  foundingDate: true,
  registrationNumber: true,
  status: true,
  contactEmail: true,
  contactPhone: true,
  contactWhatsapp: true,
  website: true,
  facebookPage: true,
  twitterHandle: true,
  address: true,
  country: true,
  region: { select: { id: true, code: true, name: true } },
  departement: { select: { id: true, code: true, name: true } },
  commune: { select: { id: true, code: true, name: true } },
  latitude: true,
  longitude: true,
  legalStatus: true,
  receiptNumber: true,
  receiptFileUrl: true,
  receiptExpiryDate: true,
  nif: true,
  ninea: true,
  totalMembers: true,
  totalVolunteers: true,
  totalStaff: true,
  annualBudget: true,
  fundingSources: true,
  bankAccountName: true,
  bankName: true,
  bankAccountNumber: true,
  statutesFileUrl: true,
  governingBoardFileUrl: true,
  taxClearanceUrl: true,
  acceptPublicContact: true,
  acceptDonations: true,
  displayMembersList: true,
  newsletterSubscribed: true,
  adminNotes: true,
  userId: true,
  createdAt: true,
  user: { select: { email: true, password: true } },
  domains: {
    where: { isDeleted: false },
    select: { domain: { select: { id: true, name: true } } },
  },
} as const;

export default async function AssociationDetailPage({
  params,
  searchParams,
}: AssociationDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const result = await getUser();
  const currentUser = result?.user?.user;

  if (!currentUser) {
    redirect("/auth/login");
  }

  await redirectAssociationOwnerFromAdminFiche(id);

  const isModerationStaff =
    currentUser.role === UserRole.ADMIN ||
    currentUser.role === UserRole.SUPER_ADMIN ||
    currentUser.role === UserRole.MODERATOR;

  if (!isModerationStaff && currentUser.role !== UserRole.ASSOCIATION) {
    redirect("/unauthorized");
  }

  const [association, regionsForSelect, departementsForSelect, communesForSelect, domainsCatalog] =
    await Promise.all([
      db.association.findFirst({
        where: { id, isDeleted: false },
        select: associationDetailSelect,
      }),
      db.region.findMany({
        where: { isDeleted: false },
        select: { id: true, code: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.departement.findMany({
        where: { isDeleted: false },
        select: { id: true, code: true, name: true, regionId: true },
        orderBy: { name: "asc" },
      }),
      db.commune.findMany({
        where: { isDeleted: false },
        select: { id: true, code: true, name: true, departementId: true },
        orderBy: { name: "asc" },
      }),
      db.domain.findMany({
        where: { isDeleted: false, isActive: true },
        select: { id: true, name: true },
        orderBy: [{ order: "asc" }, { name: "asc" }],
      }),
    ]);

  if (!association) {
    notFound();
  }

  if (
    currentUser.role === UserRole.ASSOCIATION &&
    association.userId !== currentUser.id
  ) {
    redirect("/unauthorized");
  }

  const canFullEdit =
    currentUser.role === UserRole.ADMIN ||
    currentUser.role === UserRole.SUPER_ADMIN ||
    (currentUser.role === UserRole.ASSOCIATION &&
      association.userId === currentUser.id);

  const isEditMode = resolvedSearchParams?.mode === "edit" && canFullEdit;

  const canUseToolbar =
    isModerationStaff ||
    (currentUser.role === UserRole.ASSOCIATION &&
      association.userId === currentUser.id);

  const showPendingDossier =
    association.status === AssociationStatus.PENDING && isModerationStaff;

  const canEditAdminFields =
    currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

  const showAdminToolbar =
    currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SUPER_ADMIN;

  const { user: _user, ...associationForFiche } = association;
  void _user;

  const ficheHref = await resolveAssociationWorkspaceBasePath(association.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {showAdminToolbar ? (
        <AssociationDetailToolbar
          associationId={association.id}
          associationName={association.name}
          status={association.status}
          hasLinkedUser={!!association.userId}
          linkedUserEmail={association.user?.email ?? null}
          requireCurrentPassword={
            currentUser.role === UserRole.ASSOCIATION &&
            !!association.userId &&
            association.userId === currentUser.id &&
            Boolean(association.user?.password)
          }
          canFullEdit={canFullEdit}
          canUseToolbar={canUseToolbar}
          canToggleStatus={isModerationStaff}
          showPendingDossier={showPendingDossier}
          isEditMode={isEditMode}
        />
      ) : null}

      {canUseToolbar ? (
        <AssociationWorkspaceNav
          associationId={association.id}
          active="fiche"
          ficheHref={ficheHref}
          overviewHref={associationWorkspaceOverviewHref(
            currentUser.role,
            currentUser.id,
            association.userId
          )}
        />
      ) : null}

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
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{association.name}</h1>
            <p className="text-sm text-muted-foreground">
              {association.acronym || "Sans sigle"} · Créée le{" "}
              {new Date(association.createdAt).toLocaleDateString("fr-FR", {
                dateStyle: "long",
              })}
            </p>
            {association.userId ? (
              <p className="text-xs text-muted-foreground">
                Compte lié :{" "}
                <span className="font-mono text-foreground">{association.user?.email ?? association.userId}</span>
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

      <AssociationFicheDetail
        mode={isEditMode ? "edit" : "view"}
        association={associationForFiche as AssociationFicheModel}
        regions={regionsForSelect}
        departements={departementsForSelect}
        communes={communesForSelect}
        domainsCatalog={domainsCatalog}
        canFullEdit={canFullEdit}
        showInternalAdminNotes={isModerationStaff}
        canEditAdminFields={canEditAdminFields}
        workspaceBasePath={ficheHref}
      />
    </div>
  );
}
