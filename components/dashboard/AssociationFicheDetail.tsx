import Link from "next/link";
import type { ReactNode } from "react";
import { AssociationStatus, LegalStatus } from "@prisma/client";
import { Pencil, Save, X } from "lucide-react";
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

function FieldBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-1.5 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { dateStyle: "medium" });
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return String(n);
}

function fmtBool(v: boolean): string {
  return v ? "Oui" : "Non";
}

function optLink(url: string | null | undefined, label = "Lien"): ReactNode {
  if (!url) return "—";
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">
      {label}
    </a>
  );
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
  /** Afficher les notes internes (lecture) : modérateurs et + */
  showInternalAdminNotes: boolean;
  /** Préfixe sans slash final pour liens fiche / édition (profil ou admin). */
  workspaceBasePath: string;
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {mode === "edit" ? "Modifier l’association" : "Détails de l’association"}
          </h2>
          {mode === "view" && canFullEdit ? (
            <Link
              href={`${workspaceBasePath}?mode=edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-orange-500/40 bg-orange-500/5 px-3 py-2 text-sm font-medium text-orange-800 transition-colors hover:bg-orange-500/10 dark:text-orange-200"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Modifier
            </Link>
          ) : null}
        </div>

        {mode === "view" ? (
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Identité & présentation
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <FieldBox label="Nom">{association.name}</FieldBox>
                <FieldBox label="Sigle">{association.acronym || "—"}</FieldBox>
                <FieldBox label="Devise / slogan">{association.slogan || "—"}</FieldBox>
                <FieldBox label="Statut sur la plateforme">{statusLabel[association.status]}</FieldBox>
                <FieldBox label="Statut juridique">{legalStatusFr[association.legalStatus]}</FieldBox>
                <FieldBox label="Numéro d’enregistrement / récépissé">{association.registrationNumber || "—"}</FieldBox>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3 sm:col-span-2 xl:col-span-3">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {association.description}
                  </p>
                </div>
                <FieldBox label="Logo">{optLink(association.logoUrl, "Voir le logo")}</FieldBox>
                <FieldBox label="Image de couverture">{optLink(association.coverImageUrl, "Voir l’image")}</FieldBox>
                <FieldBox label="Date de création (association)">{fmtDate(association.foundingDate)}</FieldBox>
                <FieldBox label="Domaines d’activité">
                  {association.domains.length === 0
                    ? "—"
                    : association.domains.map((d) => d.domain.name).join(", ")}
                </FieldBox>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <FieldBox label="Email de contact">
                  <span className="break-all font-mono text-xs">{association.contactEmail}</span>
                </FieldBox>
                <FieldBox label="Téléphone">{association.contactPhone}</FieldBox>
                <FieldBox label="WhatsApp">{association.contactWhatsapp || "—"}</FieldBox>
                <FieldBox label="Site web">{optLink(association.website, "Ouvrir")}</FieldBox>
                <FieldBox label="Facebook">{optLink(association.facebookPage, "Page")}</FieldBox>
                <FieldBox label="X (Twitter)">{association.twitterHandle || "—"}</FieldBox>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Localisation
              </h3>
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
                <FieldBox label="Latitude / Longitude">
                  {association.latitude != null && association.longitude != null
                    ? `${association.latitude}, ${association.longitude}`
                    : "—"}
                </FieldBox>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Statuts & pièces légales
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <FieldBox label="N° récépissé">{association.receiptNumber || "—"}</FieldBox>
                <FieldBox label="Fichier récépissé">{optLink(association.receiptFileUrl, "Document")}</FieldBox>
                <FieldBox label="Expiration récépissé">{fmtDate(association.receiptExpiryDate)}</FieldBox>
                <FieldBox label="NIF">{association.nif || "—"}</FieldBox>
                <FieldBox label="NINEA">{association.ninea || "—"}</FieldBox>
                <FieldBox label="Statuts (PDF)">{optLink(association.statutesFileUrl, "Fichier")}</FieldBox>
                <FieldBox label="Composition du bureau (PDF)">
                  {optLink(association.governingBoardFileUrl, "Fichier")}
                </FieldBox>
                <FieldBox label="Quitus fiscal">{optLink(association.taxClearanceUrl, "Fichier")}</FieldBox>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Effectifs & finance
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <FieldBox label="Membres (total)">{fmtNum(association.totalMembers)}</FieldBox>
                <FieldBox label="Bénévoles">{fmtNum(association.totalVolunteers)}</FieldBox>
                <FieldBox label="Salariés">{fmtNum(association.totalStaff)}</FieldBox>
                <FieldBox label="Budget annuel (FCFA)">{fmtNum(association.annualBudget)}</FieldBox>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3 sm:col-span-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Sources de financement
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-foreground">
                    {association.fundingSources || "—"}
                  </p>
                </div>
                <FieldBox label="Titulaire du compte bancaire">{association.bankAccountName || "—"}</FieldBox>
                <FieldBox label="Banque">{association.bankName || "—"}</FieldBox>
                <FieldBox label="N° de compte">{association.bankAccountNumber || "—"}</FieldBox>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Visibilité & communication
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <FieldBox label="Accepter d’être contacté publiquement">{fmtBool(association.acceptPublicContact)}</FieldBox>
                <FieldBox label="Accepter les dons">{fmtBool(association.acceptDonations)}</FieldBox>
                <FieldBox label="Afficher la liste des membres">{fmtBool(association.displayMembersList)}</FieldBox>
                <FieldBox label="Newsletter">{fmtBool(association.newsletterSubscribed)}</FieldBox>
              </div>
            </div>

            {showInternalAdminNotes && association.adminNotes ? (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes internes (administration)
                </h3>
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3">
                  <p className="whitespace-pre-line text-sm text-foreground">{association.adminNotes}</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
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
                      Numéro d’enregistrement / récépissé (unique)
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
                  <p className="text-xs font-medium text-muted-foreground">Domaines d’activité</p>
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
                    La région choisie doit correspondre à la commune sélectionnée (contrôle à l’enregistrement).
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
                  <label className="text-xs font-medium text-muted-foreground">Date d’expiration récépissé</label>
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
                  Accepter d’être contacté publiquement
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

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: appConfig.primaryColor }}
              >
                <Save className="h-4 w-4" aria-hidden />
                Enregistrer
              </button>
              <Link
                href={workspaceBasePath}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/70"
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
