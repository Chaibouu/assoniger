"use client";

import * as z from "zod";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import appConfig from "@/settings";
import { CheckCircle2, Loader2, XCircle, ChevronLeft, ChevronRight, MapPin, FileText, Building2, Layers, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Select, {
  type ClassNamesConfig,
  type SingleValue,
  type StylesConfig,
} from "react-select";
import {
  fetchPublicCommunes,
  fetchPublicDepartements,
  fetchPublicRegions,
  type PublicGeoOption as GeoOption,
} from "@/actions/public-geo";

type GeoSelectOption = { value: string; label: string };

const inputFieldClass =
  "h-11 min-h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none transition-[border-color,box-shadow] focus-visible:border-[#035740] focus-visible:ring-2 focus-visible:ring-[#035740]/15 placeholder:text-slate-400";

const geoSelectClassNames: ClassNamesConfig<GeoSelectOption, false> = {
  control: (state) =>
    cn(
      "!min-h-11 h-11 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-1 shadow-none",
      "hover:border-slate-300",
      state.isFocused && "!border-[#035740] !ring-2 !ring-[#035740]/15"
    ),
  menu: () =>
    "rounded-lg border border-slate-100 bg-white py-1 text-slate-800 shadow-lg",
  menuList: () => "py-1 max-h-[260px]",
  option: (state) =>
    cn(
      "cursor-pointer px-3 py-2 text-sm",
      state.isFocused && "bg-slate-50 text-slate-900",
      state.isSelected && "bg-[#035740]/10 font-medium text-[#035740]"
    ),
  placeholder: () => "text-slate-400 text-sm",
  singleValue: () => "text-slate-800 text-sm",
  input: () => "text-slate-800 text-sm",
  indicatorSeparator: () => "bg-slate-200",
  dropdownIndicator: () => "text-slate-400",
};

const geoSelectStyles: StylesConfig<GeoSelectOption, false> = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

function ReqLabel({ children }: { children: ReactNode }) {
  return (
    <FormLabel className="flex items-baseline gap-1 text-sm font-medium text-slate-700">
      <span className="text-rose-500" aria-hidden>*</span>
      <span>{children}</span>
    </FormLabel>
  );
}

function StaticReqLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="flex items-baseline gap-1 text-sm font-medium text-slate-700">
      <span className="text-rose-500" aria-hidden>*</span>
      <span>{children}</span>
    </label>
  );
}

const registerAssociationSchema = z.object({
  accountType: z.literal("association"),
  associationName: z.string().trim().min(3, "Le nom de l'association est requis"),
  email: z.string().trim().email("L'adresse email n'est pas valide"),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
  contactPhone: z.string().trim().min(3, "Le téléphone de contact est requis"),
  presidentName: z.string().trim().min(3, "Le nom du président est requis"),
  recognitionOrder: z.string().optional(),
  location: z.string().trim().min(2, "La localisation est requise"),
  activityDomain: z.string().trim().min(2, "Le domaine d'activité est requis"),
  prioritySectors: z.string().trim().min(2, "Les secteurs d'activité prioritaires sont requis"),
  regionId: z.string().trim().min(1, "La région est obligatoire"),
  departementId: z.string().trim().min(1, "Le département est obligatoire"),
  communeId: z.string().trim().min(1, "La commune est obligatoire"),
  confirmPassword: z.string().min(1, "Veuillez confirmer le mot de passe"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterValues = z.infer<typeof registerAssociationSchema>;

const STEPS = [
  { id: 1, label: "Localisation", icon: MapPin, fields: ["location", "regionId", "departementId", "communeId"] },
  { id: 2, label: "Reconnaissance légale", icon: FileText, fields: ["presidentName", "recognitionOrder"] },
  { id: 3, label: "Identification", icon: Building2, fields: ["associationName", "email", "password", "confirmPassword", "contactPhone"] },
  { id: 4, label: "Activité", icon: Layers, fields: ["activityDomain", "prioritySectors"] },
  { id: 5, label: "Identité visuelle", icon: ImageIcon, fields: [] },
] as const;

type RegisterFormProps = {
  initialRegions?: GeoOption[];
};

const EMPTY_REGIONS: GeoOption[] = [];

export function RegisterForm({ initialRegions = EMPTY_REGIONS }: RegisterFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [recognitionFile, setRecognitionFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  type ArretePdfCheckState =
    | { kind: "idle" }
    | { kind: "pending" }
    | { kind: "skipped" }
    | { kind: "short_ref" }
    | { kind: "loading" }
    | { kind: "valid" }
    | { kind: "invalid" }
    | { kind: "error"; message?: string };

  const [arretePdfCheck, setArretePdfCheck] = useState<ArretePdfCheckState>({ kind: "idle" });

  const [geoRegions, setGeoRegions] = useState<GeoOption[]>(initialRegions);
  const [geoDepartements, setGeoDepartements] = useState<GeoOption[]>([]);
  const [geoCommunes, setGeoCommunes] = useState<GeoOption[]>([]);
  const [geoRegionsLoading, setGeoRegionsLoading] = useState(initialRegions.length === 0);
  const [geoDepartementsLoading, setGeoDepartementsLoading] = useState(false);
  const [geoCommunesLoading, setGeoCommunesLoading] = useState(false);
  const [geoErrorMessage, setGeoErrorMessage] = useState<string | null>(null);
  const [geoEmptyHint, setGeoEmptyHint] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerAssociationSchema),
    defaultValues: {
      accountType: "association",
      associationName: "",
      email: "",
      password: "",
      contactPhone: "",
      presidentName: "",
      recognitionOrder: "",
      location: "",
      activityDomain: "",
      prioritySectors: "",
      regionId: "",
      departementId: "",
      communeId: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const watchedRegionId = form.watch("regionId");
  const watchedDepartementId = form.watch("departementId");
  const watchedRecognitionOrder = useWatch({ control: form.control, name: "recognitionOrder", defaultValue: "" });

  useEffect(() => {
    let cancelled = false;
    async function loadRegions() {
      if (initialRegions.length > 0) {
        setGeoRegions(initialRegions);
        setGeoRegionsLoading(false);
        if (initialRegions.length === 0) setGeoEmptyHint("Le référentiel géographique est vide.");
        return;
      }
      setGeoRegionsLoading(true);
      try {
        const list = await fetchPublicRegions();
        if (cancelled) return;
        setGeoRegions(list);
        if (list.length === 0) setGeoEmptyHint(process.env.NODE_ENV === "development" ? "Aucune région. Lancez : npx prisma db seed" : "Le référentiel géographique est vide.");
      } catch {
        if (!cancelled) { setGeoRegions([]); setGeoErrorMessage("Impossible de charger les régions."); }
      } finally {
        if (!cancelled) setGeoRegionsLoading(false);
      }
    }
    loadRegions();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!watchedRegionId) { setGeoDepartements([]); setGeoCommunes([]); return; }
    let cancelled = false;
    async function loadDepartements() {
      setGeoDepartementsLoading(true);
      try {
        const list = await fetchPublicDepartements(watchedRegionId);
        if (!cancelled) setGeoDepartements(list);
      } catch {
        if (!cancelled) { setGeoDepartements([]); setGeoErrorMessage("Impossible de charger les départements."); }
      } finally {
        if (!cancelled) setGeoDepartementsLoading(false);
      }
    }
    loadDepartements();
    return () => { cancelled = true; };
  }, [watchedRegionId]);

  useEffect(() => {
    if (!watchedDepartementId) { setGeoCommunes([]); return; }
    let cancelled = false;
    async function loadCommunes() {
      setGeoCommunesLoading(true);
      try {
        const list = await fetchPublicCommunes(watchedDepartementId);
        if (!cancelled) setGeoCommunes(list);
      } catch {
        if (!cancelled) { setGeoCommunes([]); setGeoErrorMessage("Impossible de charger les communes."); }
      } finally {
        if (!cancelled) setGeoCommunesLoading(false);
      }
    }
    loadCommunes();
    return () => { cancelled = true; };
  }, [watchedDepartementId]);

  const regionSelectOptions = useMemo(() => geoRegions.map((r) => ({ value: r.id, label: r.name })), [geoRegions]);
  const departementSelectOptions = useMemo(() => geoDepartements.map((d) => ({ value: d.id, label: d.name })), [geoDepartements]);
  const communeSelectOptions = useMemo(() => geoCommunes.map((c) => ({ value: c.id, label: c.name })), [geoCommunes]);

  useEffect(() => {
    if (!logoFile) { setLogoPreviewUrl(null); return; }
    const url = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!recognitionFile) { setArretePdfCheck({ kind: "idle" }); return; }
    const order = (watchedRecognitionOrder ?? "").trim();
    if (order.length === 0) { setArretePdfCheck({ kind: "skipped" }); return; }
    if (order.length < 2) { setArretePdfCheck({ kind: "short_ref" }); return; }
    setArretePdfCheck({ kind: "pending" });
    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setArretePdfCheck({ kind: "loading" });
        try {
          const fd = new FormData();
          fd.append("file", recognitionFile);
          fd.append("recognitionOrder", order);
          const res = await fetch("/api/public/validate-arrete-pdf", { method: "POST", body: fd, signal: ac.signal });
          if (ac.signal.aborted) return;
          const raw = await res.text();
          let data: { valid?: boolean; error?: string } = {};
          try { data = raw ? (JSON.parse(raw) as { valid?: boolean; error?: string }) : {}; } catch {
            setArretePdfCheck({ kind: "error", message: res.status >= 500 ? "Réponse invalide du serveur." : `Réponse inattendue (code ${res.status}).` });
            return;
          }
          if (!res.ok) { setArretePdfCheck({ kind: "error", message: data.error ?? "Impossible de vérifier le PDF" }); return; }
          setArretePdfCheck(data.valid ? { kind: "valid" } : { kind: "invalid" });
        } catch (e) {
          if (ac.signal.aborted) return;
          const aborted = (typeof DOMException !== "undefined" && e instanceof DOMException && e.name === "AbortError") || (e instanceof Error && e.name === "AbortError");
          if (aborted) return;
          setArretePdfCheck({ kind: "error", message: e instanceof Error ? e.message : "" });
        }
      })();
    }, 650);
    return () => { window.clearTimeout(timer); ac.abort(); };
  }, [recognitionFile, watchedRecognitionOrder]);

  const stepFields = STEPS[currentStep - 1]?.fields ?? [];

  const orderTrimmed = (watchedRecognitionOrder ?? "").trim();
  const pdfCheckBlocking =
    currentStep === 2 &&
    recognitionFile !== null &&
    orderTrimmed.length >= 2 &&
    (arretePdfCheck.kind === "invalid" ||
      arretePdfCheck.kind === "error" ||
      arretePdfCheck.kind === "loading" ||
      arretePdfCheck.kind === "pending");

  const goNext = async () => {
    if (currentStep === 2 && !recognitionFile) {
      setError("Le document de l'arrêté de reconnaissance est requis");
      return;
    }
    if (currentStep === 2 && orderTrimmed.length >= 2) {
      if (arretePdfCheck.kind === "loading" || arretePdfCheck.kind === "pending") {
        setError("Vérification du PDF en cours — patientez avant de continuer.");
        return;
      }
      if (arretePdfCheck.kind === "invalid") {
        setError("Le numéro d'arrêté ne correspond pas au document PDF joint. Corrigez la référence ou changez de document.");
        return;
      }
      if (arretePdfCheck.kind === "error") {
        setError("La vérification du PDF a échoué. Vérifiez le document et réessayez.");
        return;
      }
    }
    const valid = await form.trigger(stepFields as unknown as (keyof RegisterValues)[]);
    setError("");
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => {
    setError("");
    setCurrentStep((s) => Math.max(s - 1, 1));
  };

  const onSubmit = async (values: RegisterValues) => {
    setError("");
    setSuccess("");

    if (!recognitionFile) { setError("Le document de l'arrêté de reconnaissance est requis"); return; }

    const orderTrim = (values.recognitionOrder ?? "").trim();
    if (orderTrim.length >= 2) {
      if (["loading", "pending", "idle"].includes(arretePdfCheck.kind)) {
        setError("Vérification du PDF en cours — patientez avant de soumettre.");
        return;
      }
      if (["invalid", "error", "short_ref"].includes(arretePdfCheck.kind)) {
        setError("Le numéro d'arrêté doit être retrouvé dans le PDF téléchargé.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, String(v)); });
      formData.append("name", values.associationName);
      formData.append("recognitionFile", recognitionFile);
      if (logoFile) formData.append("logoFile", logoFile);

      const response = await fetch("/api/public/register", { method: "POST", body: formData });
      const result = await response.json();

      if (!response.ok) { setError(result.error || "Erreur lors de l'inscription"); return; }

      toast.success("Demande envoyée avec succès", {
        description: "Votre dossier est en cours d'examen. Vous recevrez un email dès que votre compte sera activé.",
        duration: 8000,
      });
      setSuccess(result.message || "Inscription réussie.");
      form.reset({ accountType: "association", associationName: "", email: "", password: "", confirmPassword: "", contactPhone: "", presidentName: "", recognitionOrder: "", location: "", activityDomain: "", prioritySectors: "", regionId: "", departementId: "", communeId: "" });
      setRecognitionFile(null);
      setLogoFile(null);
      setArretePdfCheck({ kind: "idle" });
      setCurrentStep(1);
    } catch {
      setError("Erreur serveur");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="flex flex-col bg-slate-50">

      {/* ── Header banner ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ background: `linear-gradient(160deg, #024a36 0%, #035740 50%, #046347 80%, #053d2e 100%)` }}
      >
        {/* Fond décoratif */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-8 left-1/3 h-40 w-40 rounded-full bg-[#E26E12]/10" />
          <div className="absolute top-0 right-1/4 h-full w-px bg-white/[0.06]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          {/* Titre + description */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                Inscription
              </p>
              <h1 className="mt-1.5 text-2xl font-bold leading-tight text-white sm:text-3xl">
                Créer un compte association
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                {appConfig.websiteDescription}
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {[
                  "Annuaire officiel du Niger",
                  "Dossier examiné avant activation",
                  "Tableau de bord dédié",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-xs text-white/75">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#E26E12]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Indicateur d'étapes horizontal */}
            <div className="hidden shrink-0 sm:block">
              <div className="flex items-center gap-1">
                {STEPS.map((step, idx) => {
                  const isDone = currentStep > step.id;
                  const isActive = currentStep === step.id;
                  return (
                    <div key={step.id} className="flex items-center gap-1">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                          isDone && "bg-[#E26E12] text-white",
                          isActive && "bg-white text-[#035740] shadow-md",
                          !isActive && !isDone && "bg-white/15 text-white/50"
                        )}
                        title={step.label}
                      >
                        {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={cn("h-px w-6 transition-colors", isDone ? "bg-[#E26E12]/60" : "bg-white/15")} />
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-right text-xs text-white/40">
                {STEPS[currentStep - 1]?.label}
              </p>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="h-0.5 w-full bg-white/10">
          <div
            className="h-full bg-[#E26E12] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Formulaire ── */}
      <div>
        {/* Contenu scrollable */}
        <div className="mx-auto flex w-full max-w-xl flex-col px-5 pt-8 pb-12 sm:px-7 lg:px-8 lg:pt-10 lg:pb-14">

          {/* En-tête étape */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Étape précédente"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              <span className="text-xs font-semibold uppercase tracking-widest text-[#035740]">
                Étape {currentStep} sur {STEPS.length}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{STEPS[currentStep - 1]?.label}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {currentStep === 1 && "Indiquez où est implantée votre association."}
              {currentStep === 2 && "Joignez l'arrêté officiel de reconnaissance."}
              {currentStep === 3 && "Ces identifiants serviront à accéder au tableau de bord."}
              {currentStep === 4 && "Décrivez les domaines d'intervention de l'association."}
              {currentStep === 5 && "Ajoutez le logo, puis soumettez votre dossier."}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">

              {/* ── Étape 1 : Localisation ── */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  {(geoErrorMessage || geoEmptyHint) && (
                    <div role="alert" className={cn("rounded-lg border px-3.5 py-3 text-sm", geoErrorMessage ? "border-rose-200 bg-rose-50 text-rose-700" : "border-amber-200 bg-amber-50 text-amber-800")}>
                      {geoErrorMessage ?? geoEmptyHint}
                    </div>
                  )}
                  <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Adresse / localisation</ReqLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} className={inputFieldClass} placeholder="Quartier, rue, point de repère…" autoComplete="street-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="regionId" render={({ field }) => (
                      <FormItem>
                        <ReqLabel>Région</ReqLabel>
                        <FormControl>
                          <Select<GeoSelectOption, false>
                            instanceId="register-region" unstyled name={field.name} ref={field.ref}
                            classNames={geoSelectClassNames} styles={geoSelectStyles}
                            menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed"
                            placeholder="Région" options={regionSelectOptions}
                            value={regionSelectOptions.find((o) => o.value === field.value) ?? null}
                            onChange={(opt: SingleValue<GeoSelectOption>) => { field.onChange(opt?.value ?? ""); form.setValue("departementId", ""); form.setValue("communeId", ""); }}
                            onBlur={field.onBlur} isLoading={geoRegionsLoading}
                            isDisabled={isSubmitting || geoRegionsLoading} isClearable={false} isSearchable
                            noOptionsMessage={() => geoRegionsLoading ? "Chargement…" : "Aucune région"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="departementId" render={({ field }) => (
                      <FormItem>
                        <ReqLabel>Département</ReqLabel>
                        <FormControl>
                          <Select<GeoSelectOption, false>
                            instanceId="register-departement" unstyled name={field.name} ref={field.ref}
                            classNames={geoSelectClassNames} styles={geoSelectStyles}
                            menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed"
                            placeholder="Département" options={departementSelectOptions}
                            value={departementSelectOptions.find((o) => o.value === field.value) ?? null}
                            onChange={(opt: SingleValue<GeoSelectOption>) => { field.onChange(opt?.value ?? ""); form.setValue("communeId", ""); }}
                            onBlur={field.onBlur} isLoading={geoDepartementsLoading}
                            isDisabled={isSubmitting || !watchedRegionId || geoDepartementsLoading} isClearable={false} isSearchable
                            noOptionsMessage={() => geoDepartementsLoading ? "Chargement…" : watchedRegionId ? "Aucun département" : "Choisissez une région"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="communeId" render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Commune</ReqLabel>
                      <FormControl>
                        <Select<GeoSelectOption, false>
                          instanceId="register-commune" unstyled name={field.name} ref={field.ref}
                          classNames={geoSelectClassNames} styles={geoSelectStyles}
                          menuPortalTarget={typeof document !== "undefined" ? document.body : null} menuPosition="fixed"
                          placeholder="Sélectionner une commune" options={communeSelectOptions}
                          value={communeSelectOptions.find((o) => o.value === field.value) ?? null}
                          onChange={(opt: SingleValue<GeoSelectOption>) => field.onChange(opt?.value ?? "")}
                          onBlur={field.onBlur} isLoading={geoCommunesLoading}
                          isDisabled={isSubmitting || !watchedDepartementId || geoCommunesLoading} isClearable={false} isSearchable
                          noOptionsMessage={() => geoCommunesLoading ? "Chargement…" : watchedDepartementId ? "Aucune commune" : "Choisissez un département"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* ── Étape 2 : Reconnaissance légale ── */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <FormField control={form.control} name="presidentName" render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Nom complet du président</ReqLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} className={inputFieldClass} placeholder="Prénom Nom" autoComplete="name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="recognitionOrder" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">Numéro de l'arrêté <span className="text-slate-400 font-normal">(optionnel)</span></FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} className={inputFieldClass} placeholder="Ex. : n° 2024-012 / MATD" />
                      </FormControl>
                      <p className="text-xs text-slate-400 leading-relaxed">S'il est renseigné, il doit figurer dans le PDF joint.</p>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="space-y-2">
                    <StaticReqLabel htmlFor="register-recognition-pdf">Arrêté de reconnaissance (PDF)</StaticReqLabel>
                    <label
                      htmlFor="register-recognition-pdf"
                      className={cn(
                        "relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-center transition-colors hover:border-[#035740]/40 hover:bg-slate-50",
                        recognitionFile && "border-[#035740]/30 bg-[#035740]/5"
                      )}
                    >
                      <FileText className={cn("h-8 w-8", recognitionFile ? "text-[#035740]" : "text-slate-300")} />
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          {recognitionFile ? recognitionFile.name : "Cliquez pour sélectionner un PDF"}
                        </p>
                        <p className="text-xs text-slate-400">PDF uniquement — 10 Mo maximum</p>
                      </div>
                      <input
                        id="register-recognition-pdf"
                        type="file"
                        accept="application/pdf"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        disabled={isSubmitting}
                        onChange={(e) => setRecognitionFile(e.target.files?.[0] ?? null)}
                      />
                    </label>

                    {recognitionFile && (
                      <div role="status" aria-live="polite" className={cn(
                        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
                        arretePdfCheck.kind === "valid" && "border-emerald-200 bg-emerald-50 text-emerald-800",
                        arretePdfCheck.kind === "invalid" && "border-rose-200 bg-rose-50 text-rose-700",
                        arretePdfCheck.kind === "loading" && "border-slate-200 bg-slate-50 text-slate-600",
                        ["skipped", "short_ref", "idle", "pending"].includes(arretePdfCheck.kind) && "border-slate-100 bg-slate-50 text-slate-500",
                        arretePdfCheck.kind === "error" && "border-rose-200 bg-rose-50 text-rose-700"
                      )}>
                        {arretePdfCheck.kind === "loading" && <><Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />Analyse en cours…</>}
                        {arretePdfCheck.kind === "valid" && <><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />Référence trouvée dans le PDF.</>}
                        {arretePdfCheck.kind === "invalid" && <><XCircle className="mt-0.5 h-4 w-4 shrink-0" />Référence non trouvée dans le PDF.</>}
                        {arretePdfCheck.kind === "skipped" && <span>Renseignez le numéro d'arrêté pour activer la vérification.</span>}
                        {arretePdfCheck.kind === "short_ref" && <span>Saisissez au moins 2 caractères pour la vérification.</span>}
                        {arretePdfCheck.kind === "pending" && <><Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-50" />Vérification…</>}
                        {arretePdfCheck.kind === "idle" && <span>Préparation de la vérification…</span>}
                        {arretePdfCheck.kind === "error" && <><XCircle className="mt-0.5 h-4 w-4 shrink-0" />Erreur{arretePdfCheck.message ? ` : ${arretePdfCheck.message}` : ""}.</>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Étape 3 : Identification ── */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <FormField control={form.control} name="associationName" render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Nom de l'association</ReqLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} className={inputFieldClass} placeholder="Ex. : Association pour le développement local de Tillabéri" autoComplete="organization" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <ReqLabel>Email du compte</ReqLabel>
                        <FormControl>
                          <Input {...field} disabled={isSubmitting} className={inputFieldClass} placeholder="contact@asso.ne" type="email" autoComplete="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="contactPhone" render={({ field }) => (
                      <FormItem>
                        <ReqLabel>Téléphone de contact</ReqLabel>
                        <FormControl>
                          <Input {...field} disabled={isSubmitting} className={inputFieldClass} placeholder="+227 XX XX XX XX" type="tel" autoComplete="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <FormField control={form.control} name="password" render={({ field }) => (
                      <FormItem>
                        <ReqLabel>Mot de passe</ReqLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              disabled={isSubmitting}
                              className={cn(inputFieldClass, "pr-10")}
                              placeholder="8 caractères min."
                              type={showPassword ? "text" : "password"}
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
                              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <ReqLabel>Confirmer le mot de passe</ReqLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              disabled={isSubmitting}
                              className={cn(inputFieldClass, "pr-10")}
                              placeholder="Répétez le mot de passe"
                              type={showConfirm ? "text" : "password"}
                              autoComplete="new-password"
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              onClick={() => setShowConfirm((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
                              aria-label={showConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
                            >
                              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-3 text-xs text-slate-500 leading-relaxed">
                    L'email et le mot de passe servent à l'accès du <strong className="text-slate-700">compte association</strong> sur la plateforme — ce ne sont pas des informations personnelles.
                  </div>
                </div>
              )}

              {/* ── Étape 4 : Activité ── */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <FormField control={form.control} name="activityDomain" render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Domaine d'activité principal</ReqLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} className={inputFieldClass} placeholder="Ex. : santé communautaire, alphabétisation…" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="prioritySectors" render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Secteurs d'activité prioritaires</ReqLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} className={inputFieldClass} placeholder="Ex. : eau, assainissement, petite enfance…" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* ── Étape 5 : Logo + soumission ── */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="register-association-logo" className="text-sm font-medium text-slate-700">Logo de l'association <span className="font-normal text-slate-400">(optionnel)</span></label>
                    <label
                      htmlFor="register-association-logo"
                      className={cn(
                        "relative flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-center transition-colors hover:border-[#035740]/40 hover:bg-slate-50",
                        logoFile && "border-[#035740]/30 bg-[#035740]/5"
                      )}
                    >
                      {logoPreviewUrl ? (
                        <Image src={logoPreviewUrl} alt="Prévisualisation logo" width={120} height={120} className="h-24 w-auto rounded-lg object-contain" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-300" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-600">
                          {logoFile ? logoFile.name : "Cliquez pour choisir une image"}
                        </p>
                        <p className="text-xs text-slate-400">JPG, PNG, WebP — 10 Mo maximum</p>
                      </div>
                      <input
                        id="register-association-logo"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        disabled={isSubmitting}
                        onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>

                  {/* Récapitulatif */}
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Récapitulatif</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Association</span>
                        <span className="font-medium text-slate-800 text-right">{form.watch("associationName") || "—"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Email</span>
                        <span className="font-medium text-slate-800 text-right">{form.watch("email") || "—"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Téléphone</span>
                        <span className="font-medium text-slate-800 text-right">{form.watch("contactPhone") || "—"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Président</span>
                        <span className="font-medium text-slate-800 text-right">{form.watch("presidentName") || "—"}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Arrêté PDF</span>
                        <span className={cn("font-medium text-right", recognitionFile ? "text-emerald-600" : "text-rose-500")}>
                          {recognitionFile ? recognitionFile.name : "Non joint"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-500">Logo</span>
                        <span className={cn("font-medium text-right", logoFile ? "text-emerald-600" : "text-slate-400")}>
                          {logoFile ? logoFile.name : "Non joint"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <FormError message={error} />
                  <FormSuccess message={success} />
                </div>
              )}

              {/* ── Navigation ── */}
              <div className="mt-2 flex items-center gap-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={goBack}
                    disabled={isSubmitting}
                    className="flex h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Retour
                  </button>
                )}

                {currentStep < STEPS.length ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={isSubmitting || pdfCheckBlocking}
                    className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: appConfig.primaryColor }}
                  >
                    {(arretePdfCheck.kind === "loading" || arretePdfCheck.kind === "pending") && currentStep === 2 ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Vérification…</>
                    ) : (
                      <>Continuer<ChevronRight className="h-4 w-4" /></>
                    )}
                  </button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-11 flex-1 gap-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                    style={{ backgroundColor: appConfig.primaryColor }}
                  >
                    {isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Envoi en cours…
                      </span>
                    ) : (
                      "Soumettre la demande"
                    )}
                  </Button>
                )}
              </div>

              {/* Erreur des étapes intermédiaires */}
              {currentStep < STEPS.length && error && (
                <FormError message={error} />
              )}

              {/* Lien connexion mobile */}
              <p className="mt-2 text-center text-sm text-slate-400 lg:hidden">
                Déjà un compte ?{" "}
                <Link href="/auth/login" className="font-medium text-[#035740] hover:underline">
                  Se connecter
                </Link>
              </p>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
