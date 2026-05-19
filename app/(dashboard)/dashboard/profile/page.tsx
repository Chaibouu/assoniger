import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { redirect, notFound } from "next/navigation";
import { AssociationStatus, UserRole, type LegalStatus } from "@prisma/client";
import { Building2, ExternalLink, Mail, Shield, User } from "lucide-react";
import { getUser } from "@/actions/getUser";
import { getDashboardProfileByUserId } from "@/data/user";
import appConfig from "@/settings";
import { profileAssociationWorkspacePath } from "@/lib/association-workspace-paths";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const roleLabelFr: Record<UserRole, string> = {
  [UserRole.ADMIN]: "Administrateur",
  [UserRole.SUPER_ADMIN]: "Super administrateur",
  [UserRole.MODERATOR]: "Modérateur",
  [UserRole.ASSOCIATION]: "Compte association",
  [UserRole.USER]: "Utilisateur",
  [UserRole.MEMBER]: "Membre",
  [UserRole.CITIZEN]: "Citoyen",
};

const associationStatusFr: Record<AssociationStatus, string> = {
  [AssociationStatus.PENDING]: "En attente",
  [AssociationStatus.VERIFIED]: "Vérifiée",
  [AssociationStatus.ACTIVE]: "Active",
  [AssociationStatus.REJECTED]: "Rejetée",
  [AssociationStatus.SUSPENDED]: "Suspendue",
  [AssociationStatus.INACTIVE]: "Inactive",
  [AssociationStatus.DELETED]: "Supprimée",
};

const legalStatusFr: Record<LegalStatus, string> = {
  DECLARED: "Association déclarée",
  PUBLIC_UTILITY: "Reconnue d'utilité publique",
  COOPERATIVE: "Coopérative",
  MUTUAL: "Mutuelle",
  UNION: "Union / fédération",
  OTHER: "Autre statut",
};

function ProfileSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: appConfig.primaryColor }} aria-hidden />
      <div className="p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon className="h-4 w-4 text-foreground/80" aria-hidden />
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/50 py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground sm:text-right">{value ?? "—"}</span>
    </div>
  );
}

export default async function DashboardProfilePage() {
  const result = await getUser();
  const sessionUser = result?.user?.user;

  if (!sessionUser?.id) {
    redirect("/auth/login");
  }

  const profile = await getDashboardProfileByUserId(sessionUser.id);
  if (!profile) {
    notFound();
  }

  const isAssociationAccount = profile.role === UserRole.ASSOCIATION;
  const association = profile.managedAssociations[0] ?? null;

  return (
    <div
      className={cn(
        "mx-auto space-y-6 pb-10",
        isAssociationAccount && association ? "max-w-5xl" : "max-w-4xl"
      )}
    >
      {isAssociationAccount && association ? (
        <>
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Mon espace association
                </h1>
                <p className="text-sm text-muted-foreground">{association.name}</p>
              </div>
            </div>
          </div>

        </>
      ) : (
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {isAssociationAccount ? "Mon espace association" : "Mon profil"}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {isAssociationAccount
              ? "Centralisez la gestion de votre association : fiche, membres du bureau, demandes d’adhésion et documents."
              : "Informations du compte avec lequel vous êtes connecté au tableau de bord."}
          </p>
        </header>
      )}

      {isAssociationAccount && association ? (
        <ProfileSection title="Aperçu de l’association" icon={Building2}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:mx-0">
              {association.logoUrl ? (
                <Image
                  src={association.logoUrl}
                  alt={association.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <Building2 className="h-10 w-10" aria-hidden />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-foreground">{association.name}</p>
                <Badge variant="outline" className="font-normal">
                  {associationStatusFr[association.status]}
                </Badge>
              </div>
              {association.acronym ? (
                <p className="text-sm text-muted-foreground">Sigle : {association.acronym}</p>
              ) : null}
              {association.slogan ? (
                <p className="text-sm italic text-muted-foreground">{association.slogan}</p>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href={profileAssociationWorkspacePath(association.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted/70"
                >
                  Ouvrir la fiche complète
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-0 border-t border-border/60 pt-4">
            <FieldRow label="Email de contact (association)" value={association.contactEmail} />
            <FieldRow label="Téléphone" value={association.contactPhone} />
            <FieldRow
              label="Localisation"
              value={
                <span>
                  {association.region.name}
                  {association.departement ? ` · ${association.departement.name}` : ""}
                  {association.commune ? ` · ${association.commune.name}` : ""}
                </span>
              }
            />
          </div>
        </ProfileSection>
      ) : isAssociationAccount && !association ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          Aucune association n’est encore liée à ce compte. Contactez l’administrateur si vous pensez qu’il s’agit
          d’une erreur.
        </div>
      ) : null}

      <ProfileSection title="Compte utilisateur (connexion)" icon={User}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-medium">
            {roleLabelFr[profile.role] ?? profile.role}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "font-medium",
              profile.isActive
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            )}
          >
            {profile.isActive ? "Compte actif" : "Compte désactivé"}
          </Badge>
          {profile.emailVerified ? (
            <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-950 dark:text-sky-100">
              Email vérifié
            </Badge>
          ) : (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10">
              Email non vérifié
            </Badge>
          )}
        </div>

        <div className="space-y-0">
          <FieldRow label="Nom affiché" value={profile.name ?? "—"} />
          {(profile.firstName || profile.lastName) && (
            <FieldRow
              label="Prénom / Nom"
              value={
                [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "—"
              }
            />
          )}
          <FieldRow
            label="Email"
            value={
              profile.email ? (
                <span className="inline-flex items-center gap-2 break-all">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  {profile.email}
                </span>
              ) : (
                "—"
              )
            }
          />
          <FieldRow
            label="Authentification à deux facteurs"
            value={profile.isTwoFactorEnabled ? "Activée" : "Désactivée"}
          />
        </div>
      </ProfileSection>

      {!isAssociationAccount ? (
        <ProfileSection title="Rôle sur la plateforme" icon={Shield}>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Votre rôle actuel est <strong className="text-foreground">{roleLabelFr[profile.role]}</strong>. Les
            droits d’accès aux menus et aux actions du tableau de bord en découlent.
          </p>
        </ProfileSection>
      ) : null}
    </div>
  );
}
