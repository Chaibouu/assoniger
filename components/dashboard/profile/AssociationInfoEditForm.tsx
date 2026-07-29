"use client";

import { useActionState, useState, useEffect } from "react";
import { Loader2, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import { updateAssociationProfileAction } from "@/actions/associations/update-association-profile";
import type { ProfileActionResult } from "@/actions/associations/update-association-profile";
import appConfig from "@/settings";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-foreground shadow-none outline-none transition-[border-color,box-shadow] focus:border-[#035740] focus:ring-2 focus:ring-[#035740]/15 placeholder:text-slate-400 disabled:opacity-50";

const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";

type Region = { id: string; name: string; code: string };
type Departement = { id: string; name: string; regionId: string };
type Commune = { id: string; name: string; departementId: string };

type Association = {
  id: string;
  name: string;
  acronym: string | null;
  slogan: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  website: string | null;
  address: string | null;
  region: { name: string; code: string | null };
  departement: { name: string; code: string | null } | null;
  commune: { name: string; code: string | null } | null;
};

export function AssociationInfoEditForm({
  association,
  regions,
  departements,
  communes,
  onClose,
}: {
  association: Association;
  regions: Region[];
  departements: Departement[];
  communes: Commune[];
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isControlled = onClose !== undefined;
  const close = () => (isControlled ? onClose() : setOpen(false));

  const currentRegion = regions.find((r) => association.region.code && r.code === association.region.code);
  const currentDept = association.departement
    ? departements.find((d) => d.name === association.departement?.name)
    : null;
  const currentCommune = association.commune
    ? communes.find((c) => c.name === association.commune?.name)
    : null;

  const [selectedRegionId, setSelectedRegionId] = useState(currentRegion?.id ?? "");
  const [selectedDeptId, setSelectedDeptId] = useState(currentDept?.id ?? "");
  const [selectedCommuneId, setSelectedCommuneId] = useState(currentCommune?.id ?? "");

  const filteredDepts = departements.filter((d) => d.regionId === selectedRegionId);
  const filteredCommunes = communes.filter((c) => c.departementId === selectedDeptId);

  const [result, action, pending] = useActionState<ProfileActionResult | null, FormData>(
    updateAssociationProfileAction,
    null
  );

  useEffect(() => {
    if (!result) return;
    if (result.ok) {
      toast.success("Informations mises à jour avec succès");
      close();
    } else {
      toast.error(result.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!isControlled && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/70"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Modifier
      </button>
    );
  }

  return (
    <form action={action} className="space-y-6 rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
      <div className="h-1 w-full rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Modifier les informations</h3>
        <button type="button" onClick={close} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <input type="hidden" name="associationId" value={association.id} />
      <input type="hidden" name="communeId" value={selectedCommuneId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="edit-name">Nom de l'association *</label>
          <input id="edit-name" name="name" className={inputClass} defaultValue={association.name} required />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-acronym">Sigle / acronyme</label>
          <input id="edit-acronym" name="acronym" className={inputClass} defaultValue={association.acronym ?? ""} placeholder="Ex: ASNE" />
        </div>
        <div>
          <label className={labelClass} htmlFor="edit-slogan">Slogan</label>
          <input id="edit-slogan" name="slogan" className={inputClass} defaultValue={association.slogan ?? ""} placeholder="Votre devise" />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="edit-description">Description *</label>
          <textarea
            id="edit-description"
            name="description"
            rows={4}
            className={inputClass}
            defaultValue={association.description ?? ""}
            required
          />
        </div>
      </div>

      <div className="border-t border-border/50 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="edit-email">Email de contact *</label>
            <input id="edit-email" name="contactEmail" type="email" className={inputClass} defaultValue={association.contactEmail ?? ""} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-phone">Téléphone *</label>
            <input id="edit-phone" name="contactPhone" className={inputClass} defaultValue={association.contactPhone ?? ""} required />
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-whatsapp">WhatsApp</label>
            <input id="edit-whatsapp" name="contactWhatsapp" className={inputClass} defaultValue={association.contactWhatsapp ?? ""} placeholder="+227 XX XX XX XX" />
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-website">Site web</label>
            <input id="edit-website" name="website" type="url" className={inputClass} defaultValue={association.website ?? ""} placeholder="https://..." />
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Localisation</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="edit-region">Région</label>
            <select
              id="edit-region"
              className={inputClass}
              value={selectedRegionId}
              onChange={(e) => {
                setSelectedRegionId(e.target.value);
                setSelectedDeptId("");
                setSelectedCommuneId("");
              }}
            >
              <option value="">— Sélectionner —</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-dept">Département</label>
            <select
              id="edit-dept"
              className={inputClass}
              value={selectedDeptId}
              disabled={!selectedRegionId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedCommuneId("");
              }}
            >
              <option value="">— Sélectionner —</option>
              {filteredDepts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="edit-commune">Commune</label>
            <select
              id="edit-commune"
              className={inputClass}
              value={selectedCommuneId}
              disabled={!selectedDeptId}
              onChange={(e) => setSelectedCommuneId(e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {filteredCommunes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass} htmlFor="edit-address">Adresse</label>
          <input id="edit-address" name="address" className={inputClass} defaultValue={association.address ?? ""} placeholder="Quartier, rue, porte..." />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={close}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/70"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: appConfig.primaryColor }}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
