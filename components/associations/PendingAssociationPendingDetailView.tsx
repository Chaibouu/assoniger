import type { ReactNode } from "react";
import type { PendingAssociationDetail } from "@/actions/associations/pending-table";
import appConfig from "@/settings";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Building2, ExternalLink, FileText, MapPin, User } from "lucide-react";
import { PendingAssociationPdfPreviewLoader } from "@/components/associations/PendingAssociationPdfPreviewLoader";
import { PendingAssociationModerationActions } from "@/components/associations/PendingAssociationModerationActions";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: typeof Building2;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card text-card-foreground shadow-sm",
        className
      )}
    >
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: appConfig.primaryColor }} aria-hidden />
      <div className="p-5 sm:p-6">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {Icon ? <Icon className="h-4 w-4 text-foreground/80" aria-hidden /> : null}
          {title}
        </h3>
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className={cn("mt-1 text-sm font-medium text-foreground", mono && "font-mono text-xs")}>
        {value ?? <span className="font-normal text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

type Props = {
  detail: PendingAssociationDetail;
};

/**
 * Dossier association « en attente » : présentation + validation / refus.
 */
export function PendingAssociationPendingDetailView({ detail }: Props) {
  const logoSrc = detail.logoUrl ?? null;
  const receiptSrc = detail.receiptFileUrl ?? null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <Link
            href="/dashboard/associations/pending"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Retour aux dossiers en attente
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Dossier d&apos;inscription</h1>
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
            >
              En attente de validation
            </Badge>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Vérifiez les informations transmises lors de la demande de création de compte association avant de
            valider ou de refuser.
          </p>
        </div>
        <Link
          href={`/dashboard/associations/${detail.id}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/60"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          Fiche (après traitement)
        </Link>
      </div>

      <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <div className="h-1 w-full" style={{ backgroundColor: appConfig.primaryColor }} aria-hidden />
        <div className="flex flex-col gap-6 p-5 sm:flex-row sm:items-start sm:gap-8 sm:p-6">
          {logoSrc ? (
            <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:mx-0">
              <Image
                src={logoSrc}
                alt={`Logo ${detail.name}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground sm:mx-0">
              <Building2 className="h-10 w-10" aria-hidden />
            </div>
          )}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{detail.name}</h2>
            {detail.acronym ? (
              <p className="mt-1 text-sm text-muted-foreground">Sigle : {detail.acronym}</p>
            ) : null}
            {detail.slogan ? <p className="mt-2 text-sm italic text-muted-foreground">{detail.slogan}</p> : null}
            <p className="mt-3 text-xs text-muted-foreground">
              Demande enregistrée le{" "}
              {new Date(detail.createdAt).toLocaleString("fr-FR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>
      </section>

      <PendingAssociationModerationActions associationId={detail.id} associationName={detail.name} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SectionCard title="Statut & zone" icon={MapPin}>
          <div className="grid gap-3">
            <Field label="Statut juridique (formulaire)" value={detail.legalStatus} />
            <Field
              label="Région"
              value={
                <>
                  {detail.region.name}{" "}
                  <span className="text-muted-foreground">({detail.region.code})</span>
                </>
              }
            />
            <Field
              label="Département"
              value={
                detail.departement ? (
                  <>
                    {detail.departement.name}
                    {detail.departement.code ? (
                      <span className="text-muted-foreground"> ({detail.departement.code})</span>
                    ) : null}
                  </>
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Commune"
              value={
                detail.commune ? (
                  <>
                    {detail.commune.name}
                    {detail.commune.code ? (
                      <span className="text-muted-foreground"> ({detail.commune.code})</span>
                    ) : null}
                  </>
                ) : (
                  "—"
                )
              }
            />
            <Field label="Pays" value={detail.country} />
          </div>
        </SectionCard>

        <SectionCard title="Coordonnées association" icon={User} className="sm:col-span-2 lg:col-span-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email de contact" value={detail.contactEmail} mono />
            <Field label="Téléphone" value={detail.contactPhone} />
            <Field label="WhatsApp" value={detail.contactWhatsapp} />
            <Field label="Site web" value={detail.website} mono />
            <div className="sm:col-span-2">
              <Field label="Adresse / localisation indiquée" value={detail.address} />
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Compte utilisateur (connexion)" icon={User}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Email du compte" value={detail.accountEmail} mono />
          <Field label="Nom sur le compte" value={detail.accountName} />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Identifiants utilisés pour se connecter au tableau de bord association après validation du compte.
        </p>
      </SectionCard>

      <SectionCard title="Description & activités" icon={Building2}>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{detail.description}</p>
      </SectionCard>

      {detail.presidentName ? (
        <SectionCard title="Représentant (formulaire)" icon={User}>
          <p className="text-sm font-medium text-foreground">{detail.presidentName}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Rôle enregistré : président (selon formulaire public).
          </p>
        </SectionCard>
      ) : null}

      <SectionCard title="Documents fournis" icon={FileText}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Numéro d&apos;arrêté / récépissé (saisi)" value={detail.receiptNumber} mono />
          {!receiptSrc ? (
            <Field label="Fichier PDF récépissé" value="Non joint" />
          ) : (
            <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                Fichier joint
              </p>
              <p className="mt-1 text-sm text-foreground">Arrêté de reconnaissance (PDF)</p>
              <a
                href={receiptSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-medium hover:underline"
                style={{ color: appConfig.primaryColor }}
              >
                Ouvrir dans un nouvel onglet
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
          )}
        </div>

        {receiptSrc ? (
          <div className="mt-6 space-y-2 border-t border-border/60 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prévisualisation</p>
            <PendingAssociationPdfPreviewLoader src={receiptSrc} title={`Aperçu PDF — ${detail.name}`} />
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
