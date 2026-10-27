import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import { AssociationStatus, UserRole, type LegalStatus } from "@prisma/client";
import {
  Building2,
  ExternalLink,
  Mail,
  Shield,
  User,
  Phone,
  Globe,
  MapPin,
  FileText,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  MessageCircle,
  BadgeCheck,
} from "lucide-react";
import { getUser } from "@/actions/getUser";
import { getDashboardProfileByUserId } from "@/data/user";
import { db } from "@/lib/db";
import appConfig from "@/settings";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AssociationInfoEditForm } from "@/components/dashboard/profile/AssociationInfoEditForm";
import { AssociationPasswordForm } from "@/components/dashboard/profile/AssociationPasswordForm";
import { TwoFactorSettings } from "@/components/dashboard/TwoFactorSettings";

const roleLabelFr: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrateur",
  [UserRole.SUPER_ADMIN]: "Super administrateur",
  [UserRole.MODERATOR]: "Modérateur",
  [UserRole.ASSOCIATION]: "Compte association",
  [UserRole.USER]: "Utilisateur",
  [UserRole.MEMBER]: "Membre",
  [UserRole.CITIZEN]: "Citoyen",
};

const roleDescFr: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Accès complet à la modération, aux associations et aux paramètres de la plateforme.",
  [UserRole.SUPER_ADMIN]: "Accès total à toutes les fonctionnalités, y compris l'impersonation et la configuration système.",
  [UserRole.MODERATOR]: "Peut examiner et modérer les contenus et les dossiers d'associations.",
  [UserRole.ASSOCIATION]: "Titulaire d'un compte association — gère la fiche, les membres et les documents.",
  [UserRole.USER]: "Compte utilisateur standard avec accès au tableau de bord personnel.",
  [UserRole.MEMBER]: "Membre rattaché à une association.",
  [UserRole.CITIZEN]: "Compte citoyen avec accès en lecture à l'annuaire.",
};

const associationStatusConfig: Record<AssociationStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  [AssociationStatus.PENDING]: { label: "En attente de validation", color: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200", icon: AlertCircle },
  [AssociationStatus.VERIFIED]: { label: "Vérifiée", color: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-200", icon: BadgeCheck },
  [AssociationStatus.ACTIVE]: { label: "Active", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200", icon: CheckCircle2 },
  [AssociationStatus.REJECTED]: { label: "Rejetée", color: "border-destructive/40 bg-destructive/10 text-destructive", icon: XCircle },
  [AssociationStatus.SUSPENDED]: { label: "Suspendue", color: "border-orange-500/40 bg-orange-500/10 text-orange-800 dark:text-orange-200", icon: AlertCircle },
  [AssociationStatus.INACTIVE]: { label: "Inactive", color: "border-slate-400/40 bg-slate-400/10 text-slate-600 dark:text-slate-300", icon: XCircle },
  [AssociationStatus.DELETED]: { label: "Supprimée", color: "border-destructive/40 bg-destructive/10 text-destructive", icon: XCircle },
};

const legalStatusFr: Record<LegalStatus, string> = {
  DECLARED: "Association déclarée",
  PUBLIC_UTILITY: "Reconnue d'utilité publique",
  COOPERATIVE: "Coopérative",
  MUTUAL: "Mutuelle",
  UNION: "Union / fédération",
  OTHER: "Autre statut",
};

function Section({ title, icon: Icon, children, className }: { title: string; icon: typeof User; children: ReactNode; className?: string }) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm", className)}>
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: appConfig.primaryColor }} aria-hidden />
      <div className="p-5 sm:p-6">
        <h2 className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden />
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Field({ label, value, icon: Icon }: { label: string; value: ReactNode; icon?: typeof Mail }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border/40 py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
        {label}
      </span>
      <span className="text-sm font-medium text-foreground sm:text-right">{value ?? <span className="text-muted-foreground">—</span>}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: ReactNode; icon: typeof Users }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/60 bg-muted/30 px-4 py-4">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function formatDate(date: Date | null | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date));
}

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

export default async function DashboardProfilePage() {
  const result = await getUser();
  const sessionUser = result?.user?.user;

  if (!sessionUser?.id) redirect("/auth/login");

  // Session d'audit (impersonation) : la 2FA du compte ne peut pas être modifiée
  const isImpersonationSession = "isImpersonation" in result && Boolean(result.isImpersonation);
  const isAssociationRole = sessionUser.role === UserRole.ASSOCIATION;

  const [profile, regions, departements, communes] = await Promise.all([
    getDashboardProfileByUserId(sessionUser.id),
    isAssociationRole
      ? db.region.findMany({ where: { isDeleted: false }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" } })
      : Promise.resolve([] as { id: string; name: string; code: string }[]),
    isAssociationRole
      ? db.departement.findMany({ where: { isDeleted: false }, select: { id: true, name: true, regionId: true }, orderBy: { name: "asc" } })
      : Promise.resolve([] as { id: string; name: string; regionId: string }[]),
    isAssociationRole
      ? db.commune.findMany({ where: { isDeleted: false }, select: { id: true, name: true, departementId: true }, orderBy: { name: "asc" } })
      : Promise.resolve([] as { id: string; name: string; departementId: string }[]),
  ]);

  if (!profile) notFound();

  const isAssociationAccount = profile.role === UserRole.ASSOCIATION;
  const association = profile.managedAssociations[0] ?? null;
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.name || profile.email || "Utilisateur";
  const statusCfg = association ? associationStatusConfig[association.status] : null;
  const StatusIcon = statusCfg?.icon ?? AlertCircle;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8"
        style={{ background: `linear-gradient(135deg, ${appConfig.primaryColor} 0%, color-mix(in srgb, ${appConfig.primaryColor} 75%, #000) 100%)` }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/[0.05]" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-white/[0.04]" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
          {/* Avatar / Logo */}
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white/30 bg-white/20 shadow-lg sm:h-24 sm:w-24">
            {isAssociationAccount && association?.logoUrl ? (
              <Image src={association.logoUrl} alt={association.name} fill className="object-cover" unoptimized />
            ) : profile.image ? (
              <Image src={profile.image} alt={displayName} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">
                {getInitials(profile.name, profile.email)}
              </div>
            )}
          </div>

          {/* Infos principales */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              {isAssociationAccount ? "Espace association" : roleLabelFr[profile.role]}
            </p>
            <h1 className="mt-1 truncate text-2xl font-bold text-white sm:text-3xl">
              {isAssociationAccount && association ? association.name : displayName}
            </h1>
            {isAssociationAccount && association?.acronym && (
              <p className="mt-0.5 text-sm text-white/70">{association.acronym}</p>
            )}
            {!isAssociationAccount && profile.email && (
              <p className="mt-0.5 text-sm text-white/70">{profile.email}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {isAssociationAccount && statusCfg && (
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", statusCfg.color)}>
                  <StatusIcon className="h-3.5 w-3.5" aria-hidden />
                  {statusCfg.label}
                </span>
              )}
              {!isAssociationAccount && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                  <Shield className="h-3.5 w-3.5" aria-hidden />
                  {roleLabelFr[profile.role]}
                </span>
              )}
              {profile.isActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Compte actif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-200">
                  <XCircle className="h-3.5 w-3.5" aria-hidden />
                  Compte désactivé
                </span>
              )}
              {profile.emailVerified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                  Email vérifié
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── CAS ASSOCIATION ── */}
      {isAssociationAccount && association ? (
        <>
          {/* Stats rapides */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Membres" value={association.totalMembers ?? "—"} icon={Users} />
            <StatCard label="Bénévoles" value={association.totalVolunteers ?? "—"} icon={Users} />
            <StatCard label="Personnel" value={association.totalStaff ?? "—"} icon={Users} />
            <StatCard
              label="Créée le"
              value={formatDate(association.createdAt) ?? "—"}
              icon={Calendar}
            />
          </div>

          {/* Description */}
          {association.description && (
            <Section title="Description" icon={FileText}>
              <p className="text-sm leading-relaxed text-muted-foreground">{association.description}</p>
            </Section>
          )}

          {/* Contact */}
          <Section title="Coordonnées de contact" icon={Phone}>
            <Field label="Email" value={association.contactEmail} icon={Mail} />
            <Field label="Téléphone" value={association.contactPhone} icon={Phone} />
            {association.contactWhatsapp && (
              <Field label="WhatsApp" value={association.contactWhatsapp} icon={MessageCircle} />
            )}
            {association.website && (
              <Field
                label="Site web"
                icon={Globe}
                value={
                  <a href={association.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#035740] hover:underline">
                    {association.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                }
              />
            )}
          </Section>

          {/* Localisation */}
          <Section title="Localisation" icon={MapPin}>
            <Field label="Région" value={association.region.name} icon={MapPin} />
            <Field label="Département" value={association.departement?.name} icon={MapPin} />
            <Field label="Commune" value={association.commune?.name} icon={MapPin} />
            {association.address && <Field label="Adresse" value={association.address} />}
          </Section>

          {/* Informations légales */}
          <Section title="Informations légales" icon={FileText}>
            {association.legalStatus && (
              <Field label="Statut juridique" value={legalStatusFr[association.legalStatus]} icon={Shield} />
            )}
            {association.registrationNumber && (
              <Field label="Numéro de récépissé" value={association.registrationNumber} icon={FileText} />
            )}
            <Field label="Date de dépôt" value={formatDate(association.createdAt)} icon={Calendar} />
            {association.verifiedAt && (
              <Field label="Date de vérification" value={formatDate(association.verifiedAt)} icon={CheckCircle2} />
            )}
            {association.annualBudget && (
              <Field
                label="Budget annuel"
                value={new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(Number(association.annualBudget))}
              />
            )}
          </Section>

          {/* Formulaire de modification des infos */}
          <AssociationInfoEditForm
            association={{
              id: association.id,
              name: association.name,
              acronym: association.acronym,
              slogan: association.slogan,
              description: association.description,
              contactEmail: association.contactEmail,
              contactPhone: association.contactPhone,
              contactWhatsapp: association.contactWhatsapp,
              website: association.website,
              address: association.address,
              region: association.region,
              departement: association.departement,
              commune: association.commune,
            }}
            regions={regions}
            departements={departements}
            communes={communes}
          />

          {/* Compte de connexion */}
          <Section title="Compte de connexion (accès plateforme)" icon={User}>
            <p className="mb-4 text-xs text-muted-foreground">
              Ces informations correspondent au compte utilisé pour se connecter à la plateforme, distinct des coordonnées de l'association.
            </p>
            <Field label="Email de connexion" value={profile.email} icon={Mail} />
            <Field
              label="Authentification 2FA"
              icon={Lock}
              value={
                profile.isTwoFactorEnabled ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Activée
                  </span>
                ) : (
                  <span className="text-muted-foreground">Désactivée</span>
                )
              }
            />
          </Section>

          <Section title="Double authentification" icon={Lock}>
            <TwoFactorSettings enabled={profile.isTwoFactorEnabled} readOnly={isImpersonationSession} />
          </Section>

          {/* Modification du mot de passe */}
          <AssociationPasswordForm />
        </>
      ) : isAssociationAccount && !association ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-900 dark:text-amber-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <div>
            <p className="font-semibold">Aucune association liée</p>
            <p className="mt-0.5 text-xs opacity-80">Aucune association n'est encore associée à ce compte. Contactez l'administrateur si vous pensez qu'il s'agit d'une erreur.</p>
          </div>
        </div>
      ) : (
        /* ── CAS UTILISATEUR NON-ASSOCIATION ── */
        <>
          {/* Infos du compte */}
          <Section title="Informations du compte" icon={User}>
            <Field label="Nom affiché" value={profile.name} icon={User} />
            {(profile.firstName || profile.lastName) && (
              <Field
                label="Prénom / Nom"
                value={[profile.firstName, profile.lastName].filter(Boolean).join(" ")}
                icon={User}
              />
            )}
            <Field label="Email" value={profile.email} icon={Mail} />
            <Field
              label="Email vérifié"
              icon={BadgeCheck}
              value={
                profile.emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    {formatDate(profile.emailVerified)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    Non vérifié
                  </span>
                )
              }
            />
            <Field
              label="Authentification 2FA"
              icon={Lock}
              value={
                profile.isTwoFactorEnabled ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Activée
                  </span>
                ) : (
                  <span className="text-muted-foreground">Désactivée</span>
                )
              }
            />
          </Section>

          <Section title="Double authentification" icon={Lock}>
            <TwoFactorSettings enabled={profile.isTwoFactorEnabled} readOnly={isImpersonationSession} />
          </Section>

          {/* Rôle */}
          <Section title="Rôle & permissions" icon={Shield}>
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${appConfig.primaryColor}18` }}
              >
                <Shield className="h-6 w-6" style={{ color: appConfig.primaryColor }} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">{roleLabelFr[profile.role]}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{roleDescFr[profile.role]}</p>
              </div>
            </div>
          </Section>
        </>
      )}
    </div>
  );
}
