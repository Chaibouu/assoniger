import Link from "next/link";
import type { ReactNode } from "react";
import { AssociationStatus, LegalStatus } from "@prisma/client";
import {
  type LucideIcon,
  Pencil,
  Save,
  X,
  Building2,
  Phone,
  MapPin,
  FileCheck,
  Users,
  Banknote,
  Eye,
  Globe,
  Facebook,
  Twitter,
  Mail,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  UserCheck,
} from "lucide-react";
import appConfig from "@/settings";
import { updateAssociationDashboardAction } from "@/actions/associations/update-association-dashboard";

const legalStatusFr: Record<LegalStatus, string> = {
  DECLARED: "Association déclarée",
  PUBLIC_UTILITY: "Reconnue d'utilité publique",
  COOPERATIVE: "Coopérative",
  MUTUAL: "Mutuelle",
  UNION: "Union / fédération",
  OTHER: "Autre statut",
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

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const textareaClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${appConfig.primaryColor}18` }}
      >
        <Icon className="h-4 w-4" style={{ color: appConfig.primaryColor }} aria-hidden />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}

function FieldBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3 transition-colors hover:bg-muted/30">
      <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground/80">{label}</p>
      <div className="mt-1.5 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function BoolBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      Oui
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
      <XCircle className="h-3 w-3" aria-hidden />
      Non
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-border/50 bg-card px-4 py-5 text-center shadow-sm">
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${appConfig.primaryColor}12` }}
      >
        <Icon className="h-5 w-5" style={{ color: appConfig.primaryColor }} aria-hidden />
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function DomainPill({ name }: { name: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        borderColor: `${appConfig.primaryColor}30`,
        backgroundColor: `${appConfig.primaryColor}08`,
        color: appConfig.primaryColor,
      }}
    >
      {name}
    </span>
  );
}

function ExtLink({ url, label = "Lien" }: { url: string | null | undefined; label?: string }) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:underline"
      style={{ color: appConfig.primaryColor }}
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </a>
  );
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { dateStyle: "medium" });
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString("fr-FR");
}

function dateInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export type AssociationFicheRegion = { id: string; code: string; name: string };
export type AssociationFicheDepartement = { id: string; code: string | null; name: string; regionId: string };
export type AssociationFicheCommune = { id: string; code: string | null; name: string; departementId: string };
export type AssociationFicheDomain = { id: string; name: string };

export type AssociationFicheModel = {
  id: string;
  name: string;
  acronym: string | null;
  slogan: string | null;
  description: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  foundingDate: Date | null;
  registrationNumber: string | null;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string | null;
  website: string | null;
  facebookPage: string | null;
  twitterHandle: string | null;
  address: string | null;
  country: string;
  region: { code: string; name: string } | null;
  departement: { id: string; name: string; code: string } | null;
  commune: { id: string; name: string; code: string } | null;
  latitude: number | null;
  longitude: number | null;
  legalStatus: LegalStatus;
  receiptNumber: string | null;
  receiptFileUrl: string | null;
  receiptExpiryDate: Date | null;
  nif: string | null;
  ninea: string | null;
  totalMembers: number | null;
  totalVolunteers: number | null;
  totalStaff: number | null;
  annualBudget: number | null;
  fundingSources: string | null;
  bankAccountName: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  statutesFileUrl: string | null;
  governingBoardFileUrl: string | null;
  taxClearanceUrl: string | null;
  acceptPublicContact: boolean;
  acceptDonations: boolean;
  displayMembersList: boolean;
  newsletterSubscribed: boolean;
  adminNotes: string | null;
  status: AssociationStatus;
  domains: { domain: { id: string; name: string } }[];
};

type AssociationFicheDetailProps = {
  mode: "view" | "edit";
  association: AssociationFicheModel;
  regions: AssociationFicheRegion[];
  departements: AssociationFicheDepartement[];
  communes: AssociationFicheCommune[];
  domainsCatalog: AssociationFicheDomain[];
  canFullEdit: boolean;
  showInternalAdminNotes: boolean;
  workspaceBasePath: string;
  canEditAdminFields?: boolean;
};

export function AssociationFicheDetail({
  mode,
  association,
  regions,
  departements,
  communes,
  domainsCatalog,
  canFullEdit,
  showInternalAdminNotes,
  canEditAdminFields,
  workspaceBasePath,
}: AssociationFicheDetailProps) {
  const selectedDomainIds = new Set(association.domains.map((d) => d.domain.id));

  const deptById = new Map(departements.map((d) => [d.id, d]));
  const regionById = new Map(regions.map((r) => [r.id, r]));

  const communeOptionsLabeled = communes
    .map((c) => {
      const dept = deptById.get(c.departementId);
      if (!dept) return { id: c.id, label: c.name };
      const region = regionById.get(dept.regionId);
      const regionName = region?.name ?? "";
      return {
        id: c.id,
        label: `${regionName ? `${regionName} · ` : ""}${dept.name} · ${c.name}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  return (
    <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: appConfig.primaryColor }} aria-hidden />
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {mode === "edit" ? "Modifier l'association" : "Fiche détaillée"}
          </h2>
          {mode === "view" && canFullEdit ? (
            <Link
              href={`${workspaceBasePath}?mode=edit`}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/60"
              style={{ borderColor: `${appConfig.secondaryColor}50`, color: appConfig.secondaryColor }}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Modifier
            </Link>
          ) : null}
        </div>

        {mode === "view" ? (
          <div className="space-y-8">

            {/* ── Identité & présentation ── */}
            <div>
              <SectionHeader icon={Building2} title="Identité & présentation" />

              {/* Logo + slogan banner si logo dispo */}
              {association.logoUrl && (
                <div className="mb-4 flex items-center gap-4 rounded-xl border border-border/50 bg-muted/10 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={association.logoUrl}
                    alt={`Logo ${association.name}`}
                    className="h-16 w-16 rounded-xl object-cover shadow-sm ring-1 ring-border/40"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{association.name}</p>
                    {association.slogan && (
                      <p className="mt-0.5 text-sm italic text-muted-foreground">"{association.slogan}"</p>
                    )}
                    {association.acronym && (
                      <p className="mt-1 text-xs font-medium text-muted-foreground">{association.acronym}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {!association.logoUrl && (
                  <>
                    <FieldBox label="Nom">{association.name}</FieldBox>
                    <FieldBox label="Sigle">{association.acronym || "—"}</FieldBox>
                    <FieldBox label="Devise / slogan">{association.slogan || "—"}</FieldBox>
                  </>
                )}
                <FieldBox label="Statut juridique">{legalStatusFr[association.legalStatus]}</FieldBox>
                <FieldBox label="N° enregistrement">{association.registrationNumber || "—"}</FieldBox>
                <FieldBox label="Date de création">{fmtDate(association.foundingDate)}</FieldBox>

                {/* Description pleine largeur */}
                <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3 sm:col-span-2 xl:col-span-3">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Description
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {association.description}
                  </p>
                </div>

                {/* Domaines d'activité en pills */}
                <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3 sm:col-span-2 xl:col-span-3">
                  <p className="mb-2.5 text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Domaines d'activité
                  </p>
                  {association.domains.length === 0 ? (
                    <span className="text-sm text-muted-foreground">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {association.domains.map((d) => (
                        <DomainPill key={d.domain.id} name={d.domain.name} />
                      ))}
                    </div>
                  )}
                </div>

                <FieldBox label="Logo">
                  <ExtLink url={association.logoUrl} label="Voir le logo" />
                </FieldBox>
                <FieldBox label="Image de couverture">
                  <ExtLink url={association.coverImageUrl} label="Voir l'image" />
                </FieldBox>
              </div>
            </div>

            {/* ── Contact ── */}
            <div>
              <SectionHeader icon={Phone} title="Contact & réseaux" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <FieldBox label="Email de contact">
                  <span className="inline-flex items-center gap-1.5 break-all font-mono text-xs">
                    <Mail className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                    {association.contactEmail}
                  </span>
                </FieldBox>
                <FieldBox label="Téléphone">
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                    {association.contactPhone}
                  </span>
                </FieldBox>
                <FieldBox label="WhatsApp">{association.contactWhatsapp || "—"}</FieldBox>
                <FieldBox label="Site web">
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                    <ExtLink url={association.website} label="Ouvrir" />
                  </span>
                </FieldBox>
                <FieldBox label="Facebook">
                  <span className="inline-flex items-center gap-1.5">
                    <Facebook className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                    <ExtLink url={association.facebookPage} label="Page" />
                  </span>
                </FieldBox>
                <FieldBox label="X / Twitter">
                  <span className="inline-flex items-center gap-1.5">
                    <Twitter className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                    {association.twitterHandle || "—"}
                  </span>
                </FieldBox>
              </div>
            </div>

            {/* ── Localisation ── */}
            <div>
              <SectionHeader icon={MapPin} title="Localisation" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <FieldBox label="Pays">{association.country}</FieldBox>
                <FieldBox label="Région">{association.region?.name ?? association.region?.code ?? "—"}</FieldBox>
                <FieldBox label="Département">{association.departement?.name ?? "—"}</FieldBox>
                <FieldBox label="Commune">{association.commune?.name ?? "—"}</FieldBox>
                <FieldBox label="Adresse">
                  {association.address ? (
                    <span className="whitespace-pre-line font-normal">{association.address}</span>
                  ) : (
                    "—"
                  )}
                </FieldBox>
                <FieldBox label="Coordonnées GPS">
                  {association.latitude != null && association.longitude != null ? (
                    <span className="font-mono text-xs">
                      {association.latitude}, {association.longitude}
                    </span>
                  ) : (
                    "—"
                  )}
                </FieldBox>
              </div>
            </div>

            {/* ── Pièces légales ── */}
            <div>
              <SectionHeader icon={FileCheck} title="Statuts & pièces légales" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <FieldBox label="N° récépissé">{association.receiptNumber || "—"}</FieldBox>
                <FieldBox label="Fichier récépissé">
                  <ExtLink url={association.receiptFileUrl} label="Document" />
                </FieldBox>
                <FieldBox label="Expiration récépissé">{fmtDate(association.receiptExpiryDate)}</FieldBox>
                <FieldBox label="NIF">{association.nif || "—"}</FieldBox>
                <FieldBox label="NINEA">{association.ninea || "—"}</FieldBox>
                <FieldBox label="Statuts (PDF)">
                  <ExtLink url={association.statutesFileUrl} label="Fichier" />
                </FieldBox>
                <FieldBox label="Composition du bureau">
                  <ExtLink url={association.governingBoardFileUrl} label="Fichier" />
                </FieldBox>
                <FieldBox label="Quitus fiscal">
                  <ExtLink url={association.taxClearanceUrl} label="Fichier" />
                </FieldBox>
              </div>
            </div>

            {/* ── Effectifs & finance ── */}
            <div>
              <SectionHeader icon={Users} title="Effectifs & finance" />

              {/* Stat cards */}
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Membres" value={fmtNum(association.totalMembers)} icon={Users} />
                <StatCard label="Bénévoles" value={fmtNum(association.totalVolunteers)} icon={UserCheck} />
                <StatCard label="Salariés" value={fmtNum(association.totalStaff)} icon={Briefcase} />
                <StatCard label="Budget annuel (FCFA)" value={fmtNum(association.annualBudget)} icon={Banknote} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {/* Sources de financement */}
                <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-3 sm:col-span-2">
                  <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Sources de financement
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                    {association.fundingSources || "—"}
                  </p>
                </div>
                <FieldBox label="Titulaire du compte">{association.bankAccountName || "—"}</FieldBox>
                <FieldBox label="Banque">{association.bankName || "—"}</FieldBox>
                <FieldBox label="N° de compte">
                  <span className="font-mono text-xs">{association.bankAccountNumber || "—"}</span>
                </FieldBox>
              </div>
            </div>

            {/* ── Visibilité & communication ── */}
            <div>
              <SectionHeader icon={Eye} title="Visibilité & communication" />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <FieldBox label="Contact public">
                  <BoolBadge value={association.acceptPublicContact} />
                </FieldBox>
                <FieldBox label="Accepter les dons">
                  <BoolBadge value={association.acceptDonations} />
                </FieldBox>
                <FieldBox label="Liste des membres visible">
                  <BoolBadge value={association.displayMembersList} />
                </FieldBox>
                <FieldBox label="Newsletter">
                  <BoolBadge value={association.newsletterSubscribed} />
                </FieldBox>
              </div>
            </div>

            {/* ── Notes internes admin ── */}
            {showInternalAdminNotes && association.adminNotes ? (
              <div>
                <SectionHeader icon={ShieldCheck} title="Notes internes (administration)" />
                <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-950/20">
                  <p className="whitespace-pre-line text-sm text-foreground">{association.adminNotes}</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* ────────────── EDIT MODE ────────────── */
          <form action={updateAssociationDashboardAction} className="space-y-8">
            <input type="hidden" name="associationId" value={association.id} />

            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Identité & présentation
              </legend>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Nom</label>
                  <input name="name" defaultValue={association.name} required className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Sigle</label>
                  <input name="acronym" defaultValue={association.acronym ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Devise / slogan</label>
                  <input name="slogan" defaultValue={association.slogan ?? ""} className={inputClass} />
                </div>
                {canEditAdminFields ? (
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Numéro d'enregistrement / récépissé (unique)
                    </label>
                    <input
                      name="registrationNumber"
                      defaultValue={association.registrationNumber ?? ""}
                      className={inputClass}
                    />
                  </div>
                ) : null}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <textarea
                    name="description"
                    defaultValue={association.description}
                    required
                    rows={5}
                    className={textareaClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">URL du logo</label>
                  <input name="logoUrl" type="url" defaultValue={association.logoUrl ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">URL image de couverture</label>
                  <input
                    name="coverImageUrl"
                    type="url"
                    defaultValue={association.coverImageUrl ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date de création (association)</label>
                  <input
                    name="foundingDate"
                    type="date"
                    defaultValue={dateInputValue(association.foundingDate)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Domaines d'activité</p>
                  <div className="flex max-h-48 flex-col flex-wrap gap-2 overflow-y-auto rounded-md border border-input p-3">
                    {domainsCatalog.map((d) => (
                      <label key={d.id} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="domainIds"
                          value={d.id}
                          defaultChecked={selectedDomainIds.has(d.id)}
                          className="h-4 w-4 rounded border-input"
                        />
                        {d.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</legend>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    name="contactEmail"
                    type="email"
                    defaultValue={association.contactEmail}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Téléphone</label>
                  <input name="contactPhone" defaultValue={association.contactPhone} required className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
                  <input name="contactWhatsapp" defaultValue={association.contactWhatsapp ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Site web (URL)</label>
                  <input name="website" type="url" defaultValue={association.website ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Page Facebook (URL)</label>
                  <input
                    name="facebookPage"
                    type="url"
                    defaultValue={association.facebookPage ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Compte X / Twitter</label>
                  <input name="twitterHandle" defaultValue={association.twitterHandle ?? ""} className={inputClass} />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Localisation
              </legend>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Pays</label>
                  <input name="country" defaultValue={association.country} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Région</label>
                  <select
                    name="regionCode"
                    defaultValue={association.region?.code ?? ""}
                    required
                    className={inputClass}
                  >
                    {regions.map((r) => (
                      <option key={r.code} value={r.code}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Commune (référentiel Niger)</label>
                  <select name="communeId" defaultValue={association.commune?.id ?? ""} required className={inputClass}>
                    <option value="">— Sélectionner une commune —</option>
                    {communeOptionsLabeled.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[0.7rem] text-muted-foreground">
                    La région choisie doit correspondre à la commune sélectionnée (contrôle à l'enregistrement).
                  </p>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Adresse complète</label>
                  <textarea name="address" defaultValue={association.address ?? ""} rows={3} className={textareaClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Latitude</label>
                  <input
                    name="latitude"
                    type="number"
                    step="any"
                    defaultValue={association.latitude ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Longitude</label>
                  <input
                    name="longitude"
                    type="number"
                    step="any"
                    defaultValue={association.longitude ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Statut juridique</label>
                  <select
                    name="legalStatus"
                    defaultValue={association.legalStatus}
                    required
                    className={inputClass}
                  >
                    {Object.values(LegalStatus).map((ls) => (
                      <option key={ls} value={ls}>
                        {legalStatusFr[ls]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Statuts & pièces légales
              </legend>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">N° récépissé</label>
                  <input name="receiptNumber" defaultValue={association.receiptNumber ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">URL fichier récépissé</label>
                  <input name="receiptFileUrl" type="url" defaultValue={association.receiptFileUrl ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date d'expiration récépissé</label>
                  <input
                    name="receiptExpiryDate"
                    type="date"
                    defaultValue={dateInputValue(association.receiptExpiryDate)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">NIF</label>
                  <input name="nif" defaultValue={association.nif ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">NINEA</label>
                  <input name="ninea" defaultValue={association.ninea ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">URL statuts (PDF)</label>
                  <input name="statutesFileUrl" type="url" defaultValue={association.statutesFileUrl ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">URL composition du bureau (PDF)</label>
                  <input
                    name="governingBoardFileUrl"
                    type="url"
                    defaultValue={association.governingBoardFileUrl ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">URL quitus fiscal</label>
                  <input name="taxClearanceUrl" type="url" defaultValue={association.taxClearanceUrl ?? ""} className={inputClass} />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Effectifs & finance
              </legend>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Membres (total)</label>
                  <input
                    name="totalMembers"
                    type="number"
                    min={0}
                    defaultValue={association.totalMembers ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Bénévoles</label>
                  <input
                    name="totalVolunteers"
                    type="number"
                    min={0}
                    defaultValue={association.totalVolunteers ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Salariés</label>
                  <input
                    name="totalStaff"
                    type="number"
                    min={0}
                    defaultValue={association.totalStaff ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Budget annuel (FCFA)</label>
                  <input
                    name="annualBudget"
                    type="number"
                    min={0}
                    step="1"
                    defaultValue={association.annualBudget ?? ""}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Sources de financement</label>
                  <textarea
                    name="fundingSources"
                    defaultValue={association.fundingSources ?? ""}
                    rows={3}
                    className={textareaClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Titulaire du compte bancaire</label>
                  <input name="bankAccountName" defaultValue={association.bankAccountName ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Banque</label>
                  <input name="bankName" defaultValue={association.bankName ?? ""} className={inputClass} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">N° de compte</label>
                  <input name="bankAccountNumber" defaultValue={association.bankAccountNumber ?? ""} className={inputClass} />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Visibilité
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="acceptPublicContact"
                    defaultChecked={association.acceptPublicContact}
                    className="h-4 w-4 rounded border-input"
                  />
                  Accepter d'être contacté publiquement
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="acceptDonations"
                    defaultChecked={association.acceptDonations}
                    className="h-4 w-4 rounded border-input"
                  />
                  Accepter les dons
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="displayMembersList"
                    defaultChecked={association.displayMembersList}
                    className="h-4 w-4 rounded border-input"
                  />
                  Afficher la liste des membres
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="newsletterSubscribed"
                    defaultChecked={association.newsletterSubscribed}
                    className="h-4 w-4 rounded border-input"
                  />
                  Newsletter
                </label>
              </div>
            </fieldset>

            {canEditAdminFields ? (
              <fieldset className="space-y-4">
                <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Administration
                </legend>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Notes internes</label>
                  <textarea name="adminNotes" defaultValue={association.adminNotes ?? ""} rows={5} className={textareaClass} />
                </div>
              </fieldset>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-border/40 pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: appConfig.primaryColor }}
              >
                <Save className="h-4 w-4" aria-hidden />
                Enregistrer
              </button>
              <Link
                href={workspaceBasePath}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/70"
              >
                <X className="h-4 w-4" aria-hidden />
                Annuler
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
