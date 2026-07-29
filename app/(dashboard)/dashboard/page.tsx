import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users, FileText, Clock, CheckCircle2, XCircle, AlertCircle,
  Building2, UserCheck, ArrowRight, TrendingUp, MapPin,
  ShieldCheck, UserX, BarChart3, Activity, Layers,
} from "lucide-react";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import { AssociationStatus, UserRole } from "@prisma/client";
import appConfig from "@/settings";
import { cn } from "@/lib/utils";

/* ─── helpers ─────────────────────────────────────────── */

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfLastMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
function fmt(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n);
}
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

const statusLabel: Record<AssociationStatus, string> = {
  PENDING: "En attente", VERIFIED: "Vérifiée", ACTIVE: "Active",
  REJECTED: "Rejetée", SUSPENDED: "Suspendue", INACTIVE: "Inactive", DELETED: "Supprimée",
};
const statusColor: Record<AssociationStatus, string> = {
  PENDING: "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800",
  VERIFIED: "text-sky-700 bg-sky-50 border-sky-200 dark:text-sky-300 dark:bg-sky-950/40 dark:border-sky-800",
  ACTIVE: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800",
  REJECTED: "text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/40 dark:border-red-800",
  SUSPENDED: "text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/40 dark:border-orange-800",
  INACTIVE: "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-900/40 dark:border-slate-700",
  DELETED: "text-red-700 bg-red-50 border-red-200",
};

const verifActionLabel: Record<string, string> = {
  SUBMIT: "Soumission", APPROVE: "Approbation", REJECT: "Rejet",
  SUSPEND: "Suspension", REINSTATE: "Réintégration", UPDATE: "Mise à jour",
};

/* ─── stat card ───────────────────────────────────────── */

function StatCard({
  label, value, sub, icon: Icon, accent, href,
}: {
  label: string; value: string | number; sub?: string;
  icon: typeof Users; accent?: string; href?: string;
}) {
  const inner = (
    <div className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-foreground">{typeof value === "number" ? fmt(value) : value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: accent ? `${accent}18` : `${appConfig.primaryColor}18` }}
        >
          <Icon className="h-5 w-5" style={{ color: accent ?? appConfig.primaryColor }} aria-hidden />
        </div>
      </div>
      {href && (
        <div className="absolute right-4 bottom-4 opacity-0 transition-opacity group-hover:opacity-100">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ─── section title ───────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
      <span className="h-px flex-1 bg-border/60" />
      {children}
      <span className="h-px flex-1 bg-border/60" />
    </h2>
  );
}

/* ══════════════════════════════════════════════
   VUE ASSOCIATION
══════════════════════════════════════════════ */

async function AssociationDashboard({ userId }: { userId: string }) {
  const assoc = await db.association.findFirst({
    where: { userId, isDeleted: false },
    select: {
      id: true, name: true, acronym: true, status: true, createdAt: true,
      totalMembers: true, totalVolunteers: true, totalStaff: true, annualBudget: true,
      region: { select: { name: true } },
    },
  });

  if (!assoc) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-50/60 px-5 py-4 dark:bg-amber-950/20">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold text-amber-900 dark:text-amber-200">Aucune association liée</p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
            Aucune association n'est encore associée à ce compte. Contactez l'administrateur.
          </p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const monthStart = startOfMonth(now);

  const [membresCount, pendingCount, docsTotal, docsVerified, recentActivity] = await Promise.all([
    db.associationMember.count({
      where: { associationId: assoc.id, isDeleted: false, NOT: { position: "MEMBER_PENDING" } },
    }),
    db.associationMember.count({
      where: { associationId: assoc.id, isDeleted: false, position: "MEMBER_PENDING" },
    }),
    db.associationDocument.count({ where: { associationId: assoc.id, isDeleted: false } }),
    db.associationDocument.count({ where: { associationId: assoc.id, isDeleted: false, isVerified: true } }),
    db.activityLog.findMany({
      where: { associationId: assoc.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, action: true, entity: true, createdAt: true },
    }),
  ]);

  const docsEnAttente = docsTotal - docsVerified;
  const isActive = assoc.status === AssociationStatus.ACTIVE || assoc.status === AssociationStatus.VERIFIED;

  return (
    <div className="space-y-8">

      {/* En-tête personnalisé */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8"
        style={{ background: `linear-gradient(135deg, ${appConfig.primaryColor} 0%, #024a36 100%)` }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/[0.05]" />
          <div className="absolute bottom-0 left-1/4 h-28 w-28 rounded-full bg-white/[0.04]" />
        </div>
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Tableau de bord</p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{assoc.name}</h1>
            {assoc.acronym && <p className="mt-0.5 text-sm text-white/60">{assoc.acronym}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold", statusColor[assoc.status])}>
              {assoc.status === AssociationStatus.ACTIVE && <CheckCircle2 className="h-3.5 w-3.5" />}
              {assoc.status === AssociationStatus.PENDING && <Clock className="h-3.5 w-3.5" />}
              {assoc.status === AssociationStatus.VERIFIED && <ShieldCheck className="h-3.5 w-3.5" />}
              {assoc.status === AssociationStatus.REJECTED && <XCircle className="h-3.5 w-3.5" />}
              {statusLabel[assoc.status]}
            </span>
            <Link
              href={`/dashboard/profile`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              Mon profil <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {assoc.status === AssociationStatus.PENDING && (
          <div className="relative z-10 mt-4 rounded-lg border border-amber-400/30 bg-amber-500/15 px-4 py-3 text-sm text-amber-100">
            Votre dossier est en cours d'examen. Vous serez notifié dès la validation par l'administration.
          </div>
        )}
      </div>

      {/* Chiffres clés */}
      <div>
        <SectionTitle>Chiffres clés</SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Membres"
            value={assoc.totalMembers ?? membresCount}
            sub={`${membresCount} dans le bureau`}
            icon={Users}
            href={`/dashboard/membres-association/${assoc.id}`}
          />
          <StatCard
            label="Demandes en attente"
            value={pendingCount}
            sub="adhésions à traiter"
            icon={UserCheck}
            accent={pendingCount > 0 ? appConfig.secondaryColor : undefined}
            href={`/dashboard/adhesion-association/${assoc.id}`}
          />
          <StatCard
            label="Documents"
            value={docsTotal}
            sub={`${docsVerified} vérifiés · ${docsEnAttente} en attente`}
            icon={FileText}
            accent={docsEnAttente > 0 ? "#f59e0b" : undefined}
            href={`/dashboard/documents-association/${assoc.id}`}
          />
          <StatCard
            label="Bénévoles"
            value={assoc.totalVolunteers ?? "—"}
            sub={assoc.totalStaff ? `${assoc.totalStaff} salariés` : undefined}
            icon={UserCheck}
          />
        </div>
      </div>

      {/* Budget + infos */}
      {(assoc.annualBudget || assoc.region) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {assoc.annualBudget != null && (
            <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${appConfig.primaryColor}18` }}>
                <BarChart3 className="h-5 w-5" style={{ color: appConfig.primaryColor }} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Budget annuel</p>
                <p className="mt-0.5 text-xl font-bold text-foreground">
                  {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(assoc.annualBudget))}
                </p>
              </div>
            </div>
          )}
          {assoc.region && (
            <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-card p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${appConfig.primaryColor}18` }}>
                <MapPin className="h-5 w-5" style={{ color: appConfig.primaryColor }} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Région</p>
                <p className="mt-0.5 text-xl font-bold text-foreground">{assoc.region.name}</p>
                <p className="text-xs text-muted-foreground">Inscrite le {fmtDate(assoc.createdAt)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Activité récente */}
      {recentActivity.length > 0 && (
        <div>
          <SectionTitle>Activité récente</SectionTitle>
          <div className="mt-4 overflow-hidden rounded-xl border border-border/70 bg-card">
            <div className="h-1 w-full" style={{ backgroundColor: appConfig.primaryColor }} />
            <ul className="divide-y divide-border/50">
              {recentActivity.map((log) => (
                <li key={log.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {log.action.replace(/_/g, " ")}
                      {log.entity ? <span className="ml-1 text-muted-foreground font-normal">· {log.entity}</span> : null}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">{fmtDate(log.createdAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Accès rapides */}
      <div>
        <SectionTitle>Accès rapides</SectionTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Membres & bureau", href: `/dashboard/membres-association/${assoc.id}`, icon: Users },
            { label: "Demandes d'adhésion", href: `/dashboard/adhesion-association/${assoc.id}`, icon: UserCheck },
            { label: "Documents", href: `/dashboard/documents-association/${assoc.id}`, icon: FileText },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3.5 text-sm font-medium transition-colors hover:bg-muted/50"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              {label}
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   VUE ADMIN / STAFF
══════════════════════════════════════════════ */

async function AdminDashboard({ userName }: { userName: string }) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfLastMonth(now);

  const [
    assocByStatus,
    totalUsers,
    activeUsers,
    newAssocThisMonth,
    newAssocLastMonth,
    newUsersThisMonth,
    assocByRegion,
    pendingAssoc,
    recentVerifications,
    recentRegistrations,
  ] = await Promise.all([
    /* Associations par statut */
    db.association.groupBy({
      by: ["status"],
      where: { isDeleted: false },
      _count: { id: true },
    }),
    /* Utilisateurs */
    db.user.count({ where: { isDeleted: false } }),
    db.user.count({ where: { isDeleted: false, isActive: true } }),
    /* Nouvelles associations ce mois */
    db.association.count({ where: { isDeleted: false, createdAt: { gte: monthStart } } }),
    db.association.count({ where: { isDeleted: false, createdAt: { gte: lastMonthStart, lt: monthStart } } }),
    /* Nouveaux utilisateurs ce mois */
    db.user.count({ where: { isDeleted: false, isActive: true } }),
    /* Par région */
    db.association.groupBy({
      by: ["regionId"],
      where: { isDeleted: false },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    /* En attente (détail) */
    db.association.findMany({
      where: { isDeleted: false, status: AssociationStatus.PENDING },
      orderBy: { createdAt: "asc" },
      take: 5,
      select: { id: true, name: true, createdAt: true, region: { select: { name: true } } },
    }),
    /* Vérifications récentes */
    db.associationVerification.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true, action: true, newStatus: true, createdAt: true,
        association: { select: { name: true, id: true } },
        admin: { select: { name: true } },
      },
    }),
    /* Inscriptions récentes */
    db.association.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, status: true, createdAt: true, region: { select: { name: true } } },
    }),
  ]);

  /* Totaux par statut */
  const byStatus = Object.fromEntries(assocByStatus.map((r) => [r.status, r._count.id])) as Record<string, number>;
  const totalAssoc = assocByStatus.reduce((s, r) => s + r._count.id, 0);
  const pendingCount = byStatus[AssociationStatus.PENDING] ?? 0;
  const activeCount = (byStatus[AssociationStatus.ACTIVE] ?? 0) + (byStatus[AssociationStatus.VERIFIED] ?? 0);

  /* Régions avec noms */
  const regionIds = assocByRegion.map((r) => r.regionId).filter(Boolean) as string[];
  const regionNames = await db.region.findMany({
    where: { id: { in: regionIds } },
    select: { id: true, name: true },
  });
  const regionMap = Object.fromEntries(regionNames.map((r) => [r.id, r.name]));

  const growthSign = newAssocThisMonth >= newAssocLastMonth ? "+" : "";

  return (
    <div className="space-y-8">

      {/* En-tête */}
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-7 sm:px-8"
        style={{ background: `linear-gradient(135deg, ${appConfig.primaryColor} 0%, #024a36 100%)` }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/[0.05]" />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Tableau de bord</h1>
          <p className="mt-1 text-sm text-white/70">Bonjour {userName} — vue d'ensemble de la plateforme</p>
        </div>
      </div>

      {/* Stats principales */}
      <div>
        <SectionTitle>Vue d'ensemble</SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Associations"
            value={totalAssoc}
            sub={`${activeCount} actives / vérifiées`}
            icon={Building2}
            href="/dashboard/associations"
          />
          <StatCard
            label="En attente"
            value={pendingCount}
            sub="dossiers à valider"
            icon={Clock}
            accent={pendingCount > 0 ? appConfig.secondaryColor : undefined}
            href="/dashboard/associations/pending"
          />
          <StatCard
            label="Ce mois-ci"
            value={newAssocThisMonth}
            sub={`${growthSign}${newAssocThisMonth - newAssocLastMonth} vs mois dernier`}
            icon={TrendingUp}
          />
          <StatCard
            label="Utilisateurs"
            value={totalUsers}
            sub={`${activeUsers} comptes actifs`}
            icon={Users}
          />
        </div>
      </div>

      {/* Statuts détaillés */}
      <div>
        <SectionTitle>Répartition par statut</SectionTitle>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(statusLabel) as AssociationStatus[]).map((s) => (
            <div key={s} className="rounded-xl border border-border/70 bg-card px-4 py-3 text-center">
              <p className="text-2xl font-bold text-foreground">{byStatus[s] ?? 0}</p>
              <span className={cn("mt-1.5 inline-block rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold", statusColor[s])}>
                {statusLabel[s]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Dossiers en attente */}
        <div>
          <SectionTitle>Dossiers en attente</SectionTitle>
          <div className="mt-4 overflow-hidden rounded-xl border border-border/70 bg-card">
            <div className="h-1 w-full" style={{ backgroundColor: appConfig.secondaryColor }} />
            {pendingAssoc.length === 0 ? (
              <div className="flex items-center gap-3 px-5 py-6 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Aucun dossier en attente de validation.
              </div>
            ) : (
              <>
                <ul className="divide-y divide-border/50">
                  {pendingAssoc.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
                        <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.region?.name} · {fmtDate(a.createdAt)}</p>
                      </div>
                      <Link
                        href={`/dashboard/associations/pending/${a.id}`}
                        className="shrink-0 text-xs font-medium hover:underline"
                        style={{ color: appConfig.primaryColor }}
                      >
                        Examiner
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border/50 px-5 py-3">
                  <Link href="/dashboard/associations/pending" className="text-xs font-medium hover:underline" style={{ color: appConfig.primaryColor }}>
                    Voir tous les dossiers en attente →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Vérifications récentes */}
        <div>
          <SectionTitle>Historique des vérifications</SectionTitle>
          <div className="mt-4 overflow-hidden rounded-xl border border-border/70 bg-card">
            <div className="h-1 w-full" style={{ backgroundColor: appConfig.primaryColor }} />
            {recentVerifications.length === 0 ? (
              <div className="px-5 py-6 text-sm text-muted-foreground">Aucune vérification enregistrée.</div>
            ) : (
              <ul className="divide-y divide-border/50">
                {recentVerifications.map((v) => (
                  <li key={v.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      v.action === "APPROVE" ? "bg-emerald-100 dark:bg-emerald-950/50" :
                      v.action === "REJECT" ? "bg-red-100 dark:bg-red-950/50" : "bg-muted"
                    )}>
                      {v.action === "APPROVE" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> :
                       v.action === "REJECT" ? <XCircle className="h-3.5 w-3.5 text-red-500" /> :
                       <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{v.association.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {verifActionLabel[v.action] ?? v.action}
                        {v.admin?.name ? ` par ${v.admin.name}` : ""}
                        {" · "}{fmtDate(v.createdAt)}
                      </p>
                    </div>
                    {v.newStatus && (
                      <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold", statusColor[v.newStatus])}>
                        {statusLabel[v.newStatus]}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Par région + Inscriptions récentes */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Par région */}
        <div>
          <SectionTitle>Top régions</SectionTitle>
          <div className="mt-4 overflow-hidden rounded-xl border border-border/70 bg-card">
            <div className="h-1 w-full" style={{ backgroundColor: appConfig.primaryColor }} />
            <ul className="divide-y divide-border/50">
              {assocByRegion.map((r, i) => {
                const name = r.regionId ? (regionMap[r.regionId] ?? r.regionId) : "Non définie";
                const pct = totalAssoc > 0 ? Math.round((r._count.id / totalAssoc) * 100) : 0;
                return (
                  <li key={r.regionId ?? i} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <p className="truncate text-sm font-medium text-foreground">{name}</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-foreground">{r._count.id}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: appConfig.primaryColor }} />
                    </div>
                    <p className="mt-1 text-right text-xs text-muted-foreground">{pct}%</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Inscriptions récentes */}
        <div>
          <SectionTitle>Dernières inscriptions</SectionTitle>
          <div className="mt-4 overflow-hidden rounded-xl border border-border/70 bg-card">
            <div className="h-1 w-full" style={{ backgroundColor: appConfig.primaryColor }} />
            <ul className="divide-y divide-border/50">
              {recentRegistrations.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.region?.name} · {fmtDate(a.createdAt)}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold", statusColor[a.status])}>
                    {statusLabel[a.status]}
                  </span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border/50 px-5 py-3">
              <Link href="/dashboard/associations" className="text-xs font-medium hover:underline" style={{ color: appConfig.primaryColor }}>
                Voir toutes les associations →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PAGE PRINCIPALE
══════════════════════════════════════════════ */

export default async function DashboardPage() {
  const result = await getUser();
  const user = result?.user?.user;
  if (!user) redirect("/auth/login");

  const isStaff =
    user.role === UserRole.ADMIN ||
    user.role === UserRole.SUPER_ADMIN ||
    user.role === UserRole.MODERATOR;

  const isAssociation = user.role === UserRole.ASSOCIATION;

  if (isStaff) {
    return (
      <div className="mx-auto max-w-6xl space-y-0 pb-12">
        <AdminDashboard userName={user.name ?? user.email ?? "Admin"} />
      </div>
    );
  }

  if (isAssociation) {
    return (
      <div className="mx-auto max-w-4xl space-y-0 pb-12">
        <AssociationDashboard userId={user.id} />
      </div>
    );
  }

  /* Utilisateur standard — vue minimaliste */
  return (
    <div className="mx-auto max-w-3xl pb-12">
      <div className="rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${appConfig.primaryColor}18` }}>
          <Layers className="h-7 w-7" style={{ color: appConfig.primaryColor }} />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Bienvenue sur AssoNiger</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre espace personnel. Explorez les associations ou consultez votre profil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/associations" className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: appConfig.primaryColor }}>
            <Building2 className="h-4 w-4" /> Explorer les associations
          </Link>
          <Link href="/dashboard/profile" className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted/50">
            Mon profil
          </Link>
        </div>
      </div>
    </div>
  );
}
