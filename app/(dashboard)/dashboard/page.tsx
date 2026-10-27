import Link from "next/link";
import { redirect } from "next/navigation";
import { AssociationStatus, UserRole } from "@prisma/client";
import { ArrowRight, ChevronRight, FileText, Inbox, Users } from "lucide-react";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import { ASSOCIATION_MEMBER_PENDING_POSITION } from "@/lib/association-member-kind";
import {
  adhesionAssociationPath,
  documentsAssociationPath,
  membresAssociationPath,
  profileAssociationWorkspacePath,
} from "@/lib/association-workspace-paths";

const STATUS_LABELS: Record<AssociationStatus, { label: string; className: string }> = {
  PENDING: { label: "En attente de validation", className: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200" },
  VERIFIED: { label: "Validée", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200" },
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200" },
  REJECTED: { label: "Refusée", className: "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-200" },
  SUSPENDED: { label: "Suspendue", className: "bg-red-100 text-red-900 dark:bg-red-500/15 dark:text-red-200" },
  INACTIVE: { label: "Inactive", className: "bg-slate-100 text-slate-800 dark:bg-slate-500/15 dark:text-slate-200" },
  DELETED: { label: "Supprimée", className: "bg-slate-100 text-slate-800 dark:bg-slate-500/15 dark:text-slate-200" },
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">{title}</h1>
      <p className="mt-1 text-sm text-body dark:text-bodydark">{subtitle}</p>
    </div>
  );
}

/** Chiffre clé compact, cliquable quand il mène à la liste correspondante. */
function Stat({ label, value, href, hint }: { label: string; value: number; href?: string; hint?: string }) {
  const content = (
    <>
      <p className="text-sm text-body dark:text-bodydark">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-black dark:text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-body dark:text-bodydark">{hint}</p>}
    </>
  );
  const className =
    "block rounded-xl border border-stroke bg-white px-5 py-4 dark:border-strokedark dark:bg-boxdark";
  return href ? (
    <Link
      href={href}
      className={`${className} outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary`}
    >
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export default async function DashboardPage() {
  const result = await getUser();
  const user = "user" in result ? result.user?.user : undefined;
  if (!user) redirect("/auth/login");

  const isStaff =
    user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN || user.role === UserRole.MODERATOR;

  if (isStaff) return <StaffDashboard />;
  if (user.role === UserRole.ASSOCIATION) return <AssociationDashboard userId={user.id} />;

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle={`Bienvenue${user.name ? `, ${user.name}` : ""}.`} />
      <div className="rounded-xl border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
        <p className="text-sm text-body dark:text-bodydark">
          Découvrez les associations reconnues sur la plateforme et leurs actions près de chez vous.
        </p>
        <Link
          href="/associations"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Parcourir l&apos;annuaire <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </>
  );
}

/** Équipe de modération : volume de travail et dossiers à examiner. */
async function StaffDashboard() {
  const since30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [pendingCount, activeCount, blockedCount, recentCount, pending] = await Promise.all([
    db.association.count({ where: { isDeleted: false, status: AssociationStatus.PENDING } }),
    db.association.count({
      where: { isDeleted: false, status: { in: [AssociationStatus.ACTIVE, AssociationStatus.VERIFIED] } },
    }),
    db.association.count({
      where: { isDeleted: false, status: { in: [AssociationStatus.REJECTED, AssociationStatus.SUSPENDED] } },
    }),
    db.association.count({ where: { isDeleted: false, createdAt: { gte: since30Days } } }),
    db.association.findMany({
      where: { isDeleted: false, status: AssociationStatus.PENDING },
      orderBy: { createdAt: "asc" }, // les plus anciens dossiers d'abord
      take: 6,
      select: { id: true, name: true, createdAt: true, region: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Suivi des inscriptions et de la modération des associations." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Dossiers en attente" value={pendingCount} href="/dashboard/associations/pending" />
        <Stat label="Associations actives" value={activeCount} href="/dashboard/associations" />
        <Stat label="Refusées ou suspendues" value={blockedCount} />
        <Stat label="Inscriptions (30 derniers jours)" value={recentCount} />
      </div>

      <section className="mt-8 rounded-xl border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
        <header className="flex items-center justify-between gap-4 border-b border-stroke px-5 py-4 dark:border-strokedark">
          <h2 className="text-base font-semibold text-black dark:text-white">Dossiers à examiner</h2>
          {pendingCount > 0 && (
            <Link href="/dashboard/associations/pending" className="text-sm font-medium text-primary hover:underline">
              Tout voir ({pendingCount})
            </Link>
          )}
        </header>
        {pending.length === 0 ? (
          <div className="flex items-center gap-3 px-5 py-8 text-sm text-body dark:text-bodydark">
            <Inbox className="h-5 w-5 shrink-0" aria-hidden />
            Aucun dossier en attente : toutes les inscriptions ont été traitées.
          </div>
        ) : (
          <ul className="divide-y divide-stroke dark:divide-strokedark">
            {pending.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/dashboard/associations/pending/${a.id}`}
                  className="group flex items-center gap-4 px-5 py-3.5 outline-none transition-colors hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-meta-4 dark:focus-visible:bg-meta-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-black dark:text-white">{a.name}</p>
                    <p className="text-xs text-body dark:text-bodydark">
                      {a.region?.name ?? "Région non renseignée"} · déposé le {dateFormat.format(a.createdAt)}
                    </p>
                  </div>
                  <span className="hidden text-sm font-medium text-primary sm:inline">Examiner</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-body" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

/** Compte association : état du dossier et accès rapides à la gestion. */
async function AssociationDashboard({ userId }: { userId: string }) {
  const association = await db.association.findFirst({
    where: { userId, isDeleted: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, status: true, rejectedReason: true },
  });

  if (!association) {
    return (
      <>
        <PageHeader title="Tableau de bord" subtitle="Espace de gestion de votre association." />
        <div className="rounded-xl border border-stroke bg-white p-6 text-sm text-body dark:border-strokedark dark:bg-boxdark dark:text-bodydark">
          Aucune association n&apos;est rattachée à ce compte. Contactez l&apos;équipe de la plateforme.
        </div>
      </>
    );
  }

  const [memberCount, requestCount, documentCount] = await Promise.all([
    db.associationMember.count({
      where: {
        associationId: association.id,
        isDeleted: false,
        position: { not: ASSOCIATION_MEMBER_PENDING_POSITION },
      },
    }),
    db.associationMember.count({
      where: { associationId: association.id, isDeleted: false, position: ASSOCIATION_MEMBER_PENDING_POSITION },
    }),
    db.associationDocument.count({ where: { associationId: association.id, isDeleted: false } }),
  ]);

  const status = STATUS_LABELS[association.status];
  const statusHelp: Partial<Record<AssociationStatus, string>> = {
    PENDING: "Votre dossier est en cours d'examen par l'équipe de la plateforme. Vous serez notifié de la décision.",
    REJECTED: association.rejectedReason
      ? `Motif du refus : ${association.rejectedReason}`
      : "Votre dossier a été refusé. Contactez l'équipe de la plateforme pour en savoir plus.",
    SUSPENDED: "Votre association est suspendue : elle n'apparaît plus dans l'annuaire public.",
  };

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Espace de gestion de votre association." />

      <section className="rounded-xl border border-stroke bg-white p-6 dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-black dark:text-white">{association.name}</h2>
            <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
              {status.label}
            </span>
          </div>
          <Link
            href={profileAssociationWorkspacePath(association.id)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Voir la fiche <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {statusHelp[association.status] && (
          <p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-body dark:text-bodydark">
            {statusHelp[association.status]}
          </p>
        )}
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <QuickLink href={membresAssociationPath(association.id)} icon={Users} label="Membres" value={memberCount} />
        <QuickLink
          href={adhesionAssociationPath(association.id)}
          icon={Inbox}
          label="Demandes d'adhésion"
          value={requestCount}
          highlight={requestCount > 0}
        />
        <QuickLink
          href={documentsAssociationPath(association.id)}
          icon={FileText}
          label="Documents"
          value={documentCount}
        />
      </div>
    </>
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  value,
  highlight,
}: {
  href: string;
  icon: typeof Users;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-stroke bg-white px-5 py-4 outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary dark:border-strokedark dark:bg-boxdark"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-body dark:text-bodydark">{label}</span>
        <span className="block text-xl font-semibold tabular-nums text-black dark:text-white">
          {value}
          {highlight && (
            <span className="ml-2 align-middle text-xs font-medium text-amber-700 dark:text-amber-300">à traiter</span>
          )}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-body" aria-hidden />
    </Link>
  );
}
