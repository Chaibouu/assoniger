"use client";

import * as z from "zod";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { BackButton } from "@/components/auth/back-button";
import { Social } from "@/components/auth/social";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import appConfig from "@/settings";
import { ProjectFadeLoader } from "@/components/loaders";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
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
  "h-10 min-h-10 text-sm shadow-sm transition-[border-color,box-shadow] focus-visible:border-ring/80 focus-visible:ring-2 focus-visible:ring-ring/25";

const sectionCardClass =
  "space-y-5 rounded-2xl border border-border/80 bg-card p-5 shadow-sm md:space-y-6 md:p-6";

const fieldHintClass = "text-xs leading-relaxed text-muted-foreground";

const geoSelectClassNames: ClassNamesConfig<GeoSelectOption, false> = {
  control: (state) =>
    cn(
      "!min-h-10 h-10 w-full cursor-pointer rounded-md border border-input bg-background px-1 shadow-sm",
      "hover:border-muted-foreground/35",
      state.isFocused && "border-ring/80 ring-2 ring-ring/20"
    ),
  menu: () =>
    cn("rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"),
  menuList: () => "py-1 max-h-[280px]",
  option: (state) =>
    cn(
      "cursor-pointer px-3 py-2 text-sm",
      state.isFocused && "bg-accent text-accent-foreground",
      state.isSelected && "bg-primary/15 font-medium text-foreground"
    ),
  placeholder: () => "text-muted-foreground",
  singleValue: () => "text-foreground",
  input: () => "text-foreground",
  indicatorSeparator: () => "bg-border",
  dropdownIndicator: () => "text-muted-foreground",
};

const geoSelectStyles: StylesConfig<GeoSelectOption, false> = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

/** Champ obligatoire : astérisque + libellé (dans un FormField) */
function ReqLabel({ children }: { children: ReactNode }) {
  return (
    <FormLabel className="flex flex-wrap items-baseline gap-1.5 text-sm font-medium leading-snug">
      <span className="text-destructive" aria-hidden>
        *
      </span>
      <span className="text-foreground">{children}</span>
    </FormLabel>
  );
}

/** Libellé obligatoire pour champs hors react-hook-form (ex. fichier) */
function StaticReqLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex flex-wrap items-baseline gap-1.5 text-sm font-medium leading-snug text-foreground"
    >
      <span className="text-destructive" aria-hidden>
        *
      </span>
      <span>{children}</span>
    </label>
  );
}

/** Inscription association : identifiants = accès du compte association ; fichiers PDF / logo validés à l’envoi. */
const registerAssociationSchema = z.object({
  accountType: z.literal("association"),
  associationName: z
    .string()
    .trim()
    .min(3, "Le nom de l'association est requis"),
  email: z.string().trim().email("L'adresse email n'est pas valide"),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
  contactPhone: z.string().trim().min(3, "Le téléphone de contact de l'association est requis"),
  presidentName: z.string().trim().min(3, "Le nom du président est requis"),
  recognitionOrder: z.string().optional(),
  location: z.string().trim().min(2, "La localisation est requise"),
  activityDomain: z.string().trim().min(2, "Le domaine d'activité est requis"),
  prioritySectors: z.string().trim().min(2, "Les secteurs d'activité prioritaires sont requis"),
  regionId: z.string().trim().min(1, "La région est obligatoire"),
  departementId: z.string().trim().min(1, "Le département est obligatoire"),
  communeId: z.string().trim().min(1, "La commune est obligatoire"),
});

const registerMemberSchema = z.object({
  accountType: z.literal("member"),
  name: z.string().trim().min(3, "Le nom du compte est requis"),
  email: z.string().trim().email("L'adresse email n'est pas valide"),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères"),
  associationId: z.string().trim().min(1, "Veuillez sélectionner une association"),
});

const RegisterSchema = z.discriminatedUnion("accountType", [
  registerAssociationSchema,
  registerMemberSchema,
]);

type RegisterValues = z.infer<typeof RegisterSchema>;

function SectionTitle({ step, children }: { step: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/80 pb-3">
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ring-2 ring-white/10"
        style={{ backgroundColor: appConfig.primaryColor }}
      >
        {step}
      </span>
      <h2 className="min-w-0 flex-1 pt-0.5 text-base font-semibold leading-snug tracking-tight text-foreground md:text-lg">
        {children}
      </h2>
    </div>
  );
}

const fileInputClassName = cn(
  "h-auto min-h-0 cursor-pointer border-0 bg-transparent p-0 text-sm shadow-none",
  "file:me-3 file:inline-flex file:h-10 file:cursor-pointer file:items-center file:rounded-lg file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium file:shadow-sm",
  "file:bg-primary file:text-primary-foreground file:transition-colors hover:file:bg-primary/90"
);

type RegisterFormProps = {
  /** Préchargées côté serveur (page inscription) — évite fetch HTTP bloqué par CSP en prod. */
  initialRegions?: GeoOption[];
};

/** Référence stable — évite `= []` dans les props qui casse les deps React ([].length !== [].length par référence). */
const EMPTY_REGIONS: GeoOption[] = [];

export function RegisterForm({ initialRegions = EMPTY_REGIONS }: RegisterFormProps) {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [recognitionFile, setRecognitionFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  /** Erreur réseau / HTTP / API */
  const [geoErrorMessage, setGeoErrorMessage] = useState<string | null>(null);
  /** Réponse OK mais liste vide (souvent base non seedée) */
  const [geoEmptyHint, setGeoEmptyHint] = useState<string | null>(null);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
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
    },
  });

  const watchedRegionId = form.watch("regionId");
  const watchedDepartementId = form.watch("departementId");
  const watchedRecognitionOrder = useWatch({
    control: form.control,
    name: "recognitionOrder",
    defaultValue: "",
  });

  /* Régions : SSR si initialRegions ; sinon Server Action (pas de GET /api → pas de blocage CSP). */
  useEffect(() => {
    let cancelled = false;

    function applyEmptyHint(listLen: number) {
      if (listLen === 0) {
        setGeoEmptyHint(
          process.env.NODE_ENV === "development"
            ? "Aucune région en base de données. Lancez : npx prisma db seed"
            : "Le référentiel géographique est vide. Contactez l’administrateur du site."
        );
      } else {
        setGeoEmptyHint(null);
      }
    }

    async function loadRegions() {
      if (initialRegions.length > 0) {
        setGeoRegions(initialRegions);
        setGeoRegionsLoading(false);
        setGeoErrorMessage(null);
        applyEmptyHint(initialRegions.length);
        return;
      }

      setGeoRegionsLoading(true);
      setGeoErrorMessage(null);
      setGeoEmptyHint(null);
      try {
        const list = await fetchPublicRegions();
        if (cancelled) return;
        setGeoRegions(list);
        applyEmptyHint(list.length);
      } catch {
        if (!cancelled) {
          setGeoRegions([]);
          setGeoErrorMessage(
            "Impossible de charger les régions. Vérifiez la base de données ou réessayez."
          );
        }
      } finally {
        if (!cancelled) setGeoRegionsLoading(false);
      }
    }

    loadRegions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot SSR au montage uniquement
  }, []);

  useEffect(() => {
    if (!watchedRegionId) {
      setGeoDepartements([]);
      setGeoCommunes([]);
      setGeoDepartementsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDepartements() {
      setGeoDepartementsLoading(true);
      setGeoErrorMessage(null);
      try {
        const list = await fetchPublicDepartements(watchedRegionId);
        if (cancelled) return;
        setGeoDepartements(list);
      } catch {
        if (!cancelled) {
          setGeoDepartements([]);
          setGeoErrorMessage("Impossible de charger les départements pour cette région.");
        }
      } finally {
        if (!cancelled) setGeoDepartementsLoading(false);
      }
    }

    loadDepartements();
    return () => {
      cancelled = true;
    };
  }, [watchedRegionId]);

  useEffect(() => {
    if (!watchedDepartementId) {
      setGeoCommunes([]);
      setGeoCommunesLoading(false);
      return;
    }

    let cancelled = false;

    async function loadCommunes() {
      setGeoCommunesLoading(true);
      setGeoErrorMessage(null);
      try {
        const list = await fetchPublicCommunes(watchedDepartementId);
        if (cancelled) return;
        setGeoCommunes(list);
      } catch {
        if (!cancelled) {
          setGeoCommunes([]);
          setGeoErrorMessage("Impossible de charger les communes pour ce département.");
        }
      } finally {
        if (!cancelled) setGeoCommunesLoading(false);
      }
    }

    loadCommunes();
    return () => {
      cancelled = true;
    };
  }, [watchedDepartementId]);

  const regionSelectOptions = useMemo(
    () => geoRegions.map((r) => ({ value: r.id, label: r.name })),
    [geoRegions]
  );
  const departementSelectOptions = useMemo(
    () => geoDepartements.map((d) => ({ value: d.id, label: d.name })),
    [geoDepartements]
  );
  const communeSelectOptions = useMemo(
    () => geoCommunes.map((c) => ({ value: c.id, label: c.name })),
    [geoCommunes]
  );

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [logoFile]);

  useEffect(() => {
    if (!recognitionFile) {
      setArretePdfCheck({ kind: "idle" });
      return;
    }

    const order = (watchedRecognitionOrder ?? "").trim();

    if (order.length === 0) {
      setArretePdfCheck({ kind: "skipped" });
      return;
    }
    if (order.length < 2) {
      setArretePdfCheck({ kind: "short_ref" });
      return;
    }

    setArretePdfCheck({ kind: "pending" });

    const ac = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setArretePdfCheck({ kind: "loading" });
        try {
          const fd = new FormData();
          fd.append("file", recognitionFile);
          fd.append("recognitionOrder", order);
          const res = await fetch("/api/public/validate-arrete-pdf", {
            method: "POST",
            body: fd,
            signal: ac.signal,
          });
          if (ac.signal.aborted) return;

          const raw = await res.text();
          let data: { valid?: boolean; error?: string } = {};
          try {
            data = raw ? (JSON.parse(raw) as { valid?: boolean; error?: string }) : {};
          } catch {
            setArretePdfCheck({
              kind: "error",
              message:
                res.status >= 500
                  ? "Le serveur a renvoyé une réponse invalide (vérifiez les logs du terminal). Réessayez."
                  : `Réponse inattendue du serveur (code ${res.status}). Réessayez.`,
            });
            return;
          }

          if (!res.ok) {
            setArretePdfCheck({
              kind: "error",
              message: data.error ?? "Impossible de vérifier le PDF",
            });
            return;
          }
          setArretePdfCheck(data.valid ? { kind: "valid" } : { kind: "invalid" });
        } catch (e) {
          if (ac.signal.aborted) return;
          const aborted =
            (typeof DOMException !== "undefined" && e instanceof DOMException && e.name === "AbortError") ||
            (e instanceof Error && e.name === "AbortError");
          if (aborted) {
            return;
          }
          const detail = e instanceof Error ? e.message : "";
          setArretePdfCheck({
            kind: "error",
            message: detail
              ? `Échec de la requête : ${detail}`
              : "Connexion interrompue ou serveur injoignable. Réessayez.",
          });
        }
      })();
    }, 650);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [recognitionFile, watchedRecognitionOrder]);

  const onSubmit = async (values: RegisterValues) => {
    setError("");
    setSuccess("");

    if (values.accountType === "association") {
      if (!recognitionFile) {
        setError("Le document de l'arrêté de reconnaissance est requis");
        return;
      }
      if (!logoFile) {
        setError("Le logo de l'association est requis");
        return;
      }
      const orderTrim = (values.recognitionOrder ?? "").trim();
      if (orderTrim.length >= 2) {
        if (
          arretePdfCheck.kind === "loading" ||
          arretePdfCheck.kind === "pending" ||
          arretePdfCheck.kind === "idle"
        ) {
          setError("Vérification du PDF en cours — patientez un instant avant de soumettre.");
          return;
        }
        if (
          arretePdfCheck.kind === "invalid" ||
          arretePdfCheck.kind === "error" ||
          arretePdfCheck.kind === "short_ref"
        ) {
          setError(
            "Le numéro d'arrêté saisi doit être retrouvé dans le PDF téléchargé. Corrigez la référence ou le document."
          );
          return;
        }
        if (arretePdfCheck.kind !== "valid") {
          setError("La correspondance entre la référence et le PDF n'est pas confirmée.");
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      if (values.accountType === "association") {
        formData.append("name", values.associationName);
        if (recognitionFile) formData.append("recognitionFile", recognitionFile);
        if (logoFile) formData.append("logoFile", logoFile);
      }

      const response = await fetch("/api/public/register", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Erreur lors de l'inscription");
        return;
      }

      setSuccess(result.message || "Inscription réussie.");
      form.reset({
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
      });
      setRecognitionFile(null);
      setLogoFile(null);
      setArretePdfCheck({ kind: "idle" });
    } catch {
      setError("Erreur serveur");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden lg:flex-row">
      {/* Gauche : logo & texte (desktop uniquement) */}
      <div
        className="relative hidden w-full shrink-0 flex-col items-center justify-center overflow-hidden px-8 py-10 text-white sm:py-12 lg:flex lg:h-full lg:w-[48%] lg:max-w-[48%] lg:shrink-0 lg:px-12 lg:py-14"
        style={{
          background: `linear-gradient(
            165deg,
            ${appConfig.primaryColor} 0%,
            color-mix(in srgb, ${appConfig.primaryColor} 82%, #000 18%) 38%,
            color-mix(in srgb, ${appConfig.primaryColor} 68%, ${appConfig.secondaryColor} 32%) 72%,
            color-mix(in srgb, ${appConfig.primaryColor} 42%, #031a0a 58%) 100%
          )`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage: `radial-gradient(circle at 28% 18%, color-mix(in srgb, #fff 22%, transparent) 0%, transparent 42%),
              radial-gradient(circle at 82% 88%, color-mix(in srgb, ${appConfig.secondaryColor} 45%, transparent) 0%, transparent 46%)`,
          }}
        />
        <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center lg:items-start lg:text-left">
          <div className="mb-6 flex w-full justify-center lg:mb-8">
            <div className="rounded-2xl bg-white/95 p-6 shadow-2xl ring-1 ring-white/20">
              <Image
                src={appConfig.logoUrl}
                alt={appConfig.appName}
                width={180}
                height={180}
                className="mx-auto h-20 w-auto object-contain sm:h-24 lg:h-28"
                priority
              />
            </div>
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-white/80">{appConfig.appName}</p>
          <h2 className="mt-2 text-2xl font-bold leading-tight drop-shadow-sm sm:text-3xl lg:text-4xl">
            {appConfig.websiteTitle}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-white/90">{appConfig.websiteDescription}</p>
          <ul className="mt-8 w-full space-y-3 text-left text-sm text-white/95 lg:mt-10">
            <li className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" aria-hidden />
              <span>Créez votre fiche et rejoignez l&apos;annuaire officiel des associations du Niger.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" aria-hidden />
              <span>Équipe dédiée : chaque dossier est vérifié avant validation.</span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" aria-hidden />
              <span>Un compte administrateur pour piloter votre association après activation.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Formulaire : pleine largeur sur mobile, avec logo dans l&apos;en-tête ; colonne droite sur lg */}
      <div className="flex min-h-0 flex-1 flex-col bg-background lg:h-full lg:min-h-0 lg:flex-[1_1_52%] lg:border-l">
        <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto overscroll-y-contain px-5 py-5 pb-10 sm:px-7 sm:py-8 sm:pb-12 lg:px-10 lg:py-8 lg:pb-12">
          <header className="mb-4 border-b border-border/60 pb-4 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
                <Image
                  src={appConfig.logoUrl}
                  alt={appConfig.appName}
                  width={56}
                  height={56}
                  className="h-full w-full object-contain p-1.5"
                  priority
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {appConfig.appName}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  {appConfig.websiteTitle}
                </p>
              </div>
            </div>
          </header>

          <div className="border-b border-border/60 pb-6">
            <Link
              href="/auth/login"
              className="inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              ← Retour connexion
            </Link>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Créer une association
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Enregistrez une <strong className="text-foreground">nouvelle association</strong> : l&apos;email et le
              mot de passe servent aux <strong className="text-foreground">accès du compte association</strong> sur
              la plateforme. Votre dossier sera examiné par l&apos;équipe avant activation.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-6 flex flex-col gap-0"
            >
              <div className="space-y-6 py-1 pr-1 md:space-y-8">
            <section className={sectionCardClass}>
              <SectionTitle step="1">Localisation</SectionTitle>
              {(geoErrorMessage || geoEmptyHint) && (
                <div
                  role="alert"
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm leading-snug",
                    geoErrorMessage
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100"
                  )}
                >
                  {geoErrorMessage ?? geoEmptyHint}
                </div>
              )}
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <ReqLabel>Localisation (adresse complémentaire)</ReqLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className={inputFieldClass}
                          placeholder="Quartier, rue, point de repère…"
                          autoComplete="street-address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Région</ReqLabel>
                      <FormControl>
                        <Select<GeoSelectOption, false>
                          instanceId="register-region"
                          unstyled
                          name={field.name}
                          ref={field.ref}
                          classNames={geoSelectClassNames}
                          styles={geoSelectStyles}
                          menuPortalTarget={
                            typeof document !== "undefined" ? document.body : null
                          }
                          menuPosition="fixed"
                          placeholder="Choisir une région"
                          options={regionSelectOptions}
                          value={
                            regionSelectOptions.find((o) => o.value === field.value) ?? null
                          }
                          onChange={(opt: SingleValue<GeoSelectOption>) => {
                            field.onChange(opt?.value ?? "");
                            form.setValue("departementId", "");
                            form.setValue("communeId", "");
                          }}
                          onBlur={field.onBlur}
                          isLoading={geoRegionsLoading}
                          isDisabled={isSubmitting || geoRegionsLoading}
                          isClearable={false}
                          isSearchable
                          noOptionsMessage={() =>
                            geoRegionsLoading ? "Chargement…" : "Aucune région disponible"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="departementId"
                  render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Département</ReqLabel>
                      <FormControl>
                        <Select<GeoSelectOption, false>
                          instanceId="register-departement"
                          unstyled
                          name={field.name}
                          ref={field.ref}
                          classNames={geoSelectClassNames}
                          styles={geoSelectStyles}
                          menuPortalTarget={
                            typeof document !== "undefined" ? document.body : null
                          }
                          menuPosition="fixed"
                          placeholder="Choisir un département"
                          options={departementSelectOptions}
                          value={
                            departementSelectOptions.find((o) => o.value === field.value) ??
                            null
                          }
                          onChange={(opt: SingleValue<GeoSelectOption>) => {
                            field.onChange(opt?.value ?? "");
                            form.setValue("communeId", "");
                          }}
                          onBlur={field.onBlur}
                          isLoading={geoDepartementsLoading}
                          isDisabled={
                            isSubmitting ||
                            !watchedRegionId ||
                            geoDepartementsLoading
                          }
                          isClearable={false}
                          isSearchable
                          noOptionsMessage={() =>
                            geoDepartementsLoading
                              ? "Chargement…"
                              : watchedRegionId
                                ? "Aucun département pour cette région"
                                : "Choisissez d’abord une région"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="communeId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <ReqLabel>Commune</ReqLabel>
                      <FormControl>
                        <Select<GeoSelectOption, false>
                          instanceId="register-commune"
                          unstyled
                          name={field.name}
                          ref={field.ref}
                          classNames={geoSelectClassNames}
                          styles={geoSelectStyles}
                          menuPortalTarget={
                            typeof document !== "undefined" ? document.body : null
                          }
                          menuPosition="fixed"
                          placeholder="Choisir une commune"
                          options={communeSelectOptions}
                          value={
                            communeSelectOptions.find((o) => o.value === field.value) ?? null
                          }
                          onChange={(opt: SingleValue<GeoSelectOption>) =>
                            field.onChange(opt?.value ?? "")
                          }
                          onBlur={field.onBlur}
                          isLoading={geoCommunesLoading}
                          isDisabled={
                            isSubmitting ||
                            !watchedDepartementId ||
                            geoCommunesLoading
                          }
                          isClearable={false}
                          isSearchable
                          noOptionsMessage={() =>
                            geoCommunesLoading
                              ? "Chargement…"
                              : watchedDepartementId
                                ? "Aucune commune pour ce département"
                                : "Choisissez d’abord un département"
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className={sectionCardClass}>
              <SectionTitle step="2">Reconnaissance légale</SectionTitle>
              <p className={cn(fieldHintClass, "rounded-lg bg-muted/35 p-3")}>
                Nom du président tel qu&apos;il figurera sur la fiche association ; joindre l&apos;arrêté de
                reconnaissance au format PDF.
              </p>
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
                <FormField
                  control={form.control}
                  name="presidentName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <ReqLabel>Nom complet du président</ReqLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className={inputFieldClass}
                          placeholder="Ex. : Prénom Nom"
                          autoComplete="name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recognitionOrder"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-sm font-medium text-foreground">
                        Numéro / référence de l&apos;arrêté (optionnel)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className={inputFieldClass}
                          placeholder="Ex. : n° 2024-012 / MATD"
                        />
                      </FormControl>
                      <p className={fieldHintClass}>
                        Si vous le renseignez, il doit apparaître dans le PDF : après l&apos;envoi du fichier, une
                        vérification automatique est effectuée.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2 md:col-span-2">
                  <StaticReqLabel htmlFor="register-recognition-pdf">
                    Document arrêté de reconnaissance (PDF)
                  </StaticReqLabel>
                  <p className={fieldHintClass}>
                    PDF uniquement, 10 Mo maximum. Après la saisie de la référence, l’analyse se lance après une courte
                    pause (pour ne pas relancer à chaque lettre). Le <strong className="text-foreground">premier</strong>{" "}
                    scan peut prendre quelques secondes ; les suivants sont plus rapides grâce au cache du moteur OCR.
                  </p>
                  <div
                    className={cn(
                      "rounded-xl border border-dashed border-input/90 bg-muted/15 p-3 transition-colors",
                      "focus-within:border-primary/45 focus-within:bg-muted/25 focus-within:ring-2 focus-within:ring-ring/20"
                    )}
                  >
                    <Input
                      id="register-recognition-pdf"
                      disabled={isSubmitting}
                      type="file"
                      accept="application/pdf"
                      className={fileInputClassName}
                      onChange={(e) => setRecognitionFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <p className={fieldHintClass}>
                    {recognitionFile ? recognitionFile.name : "Aucun fichier PDF sélectionné"}
                  </p>
                  {recognitionFile && (
                    <div
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "mt-2 flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm leading-snug",
                        arretePdfCheck.kind === "valid" &&
                          "border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
                        arretePdfCheck.kind === "invalid" &&
                          "border-destructive/40 bg-destructive/10 text-destructive",
                        arretePdfCheck.kind === "loading" && "border-border bg-muted/40 text-foreground",
                        (arretePdfCheck.kind === "skipped" ||
                          arretePdfCheck.kind === "short_ref" ||
                          arretePdfCheck.kind === "idle" ||
                          arretePdfCheck.kind === "pending") &&
                          "border-muted-foreground/25 bg-muted/30 text-muted-foreground",
                        arretePdfCheck.kind === "error" &&
                          "border-destructive/35 bg-destructive/10 text-destructive"
                      )}
                    >
                      {arretePdfCheck.kind === "loading" && (
                        <>
                          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden />
                          <span>Analyse du PDF et comparaison avec la référence…</span>
                        </>
                      )}
                      {arretePdfCheck.kind === "valid" && (
                        <>
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                            aria-hidden
                          />
                          <span>
                            <strong className="text-foreground">Valide</strong> — la référence apparaît dans le
                            texte extrait du PDF.
                          </span>
                        </>
                      )}
                      {arretePdfCheck.kind === "invalid" && (
                        <>
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          <span>
                            <strong className="text-foreground">Non valide</strong> — la référence n’a pas été
                            retrouvée dans le texte du PDF ni par OCR (tampon illisible, mauvaise page, ou saisie
                            différente du document). Essayez le <strong className="text-foreground">numéro seul</strong>{" "}
                            (ex. <code className="rounded bg-muted px-1">000813</code>) comme sur le tampon, sans
                            espaces superflus.
                          </span>
                        </>
                      )}
                      {arretePdfCheck.kind === "skipped" && (
                        <span>
                          Renseignez le <strong className="text-foreground">numéro / référence</strong> ci-dessus pour
                          lancer la vérification automatique avec ce PDF.
                        </span>
                      )}
                      {arretePdfCheck.kind === "short_ref" && (
                        <span>
                          Saisissez au moins <strong className="text-foreground">2 caractères</strong> dans la référence
                          pour activer la vérification.
                        </span>
                      )}
                      {arretePdfCheck.kind === "pending" && (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-70" aria-hidden />
                          Vérification du PDF après votre saisie…
                        </span>
                      )}
                      {arretePdfCheck.kind === "idle" && (
                        <span className="text-muted-foreground">Préparation de la vérification…</span>
                      )}
                      {arretePdfCheck.kind === "error" && (
                        <>
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          <span>
                            Erreur lors de la lecture du PDF
                            {arretePdfCheck.message ? ` : ${arretePdfCheck.message}` : ""}.
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className={sectionCardClass}>
              <SectionTitle step="3">Accès et identification de l&apos;association</SectionTitle>
              <p className={cn(fieldHintClass, "rounded-lg bg-muted/35 p-3")}>
                Email et mot de passe : connexion au tableau de bord pour le compte de l&apos;association (pas un
                compte personnel). Le téléphone est celui utilisé pour joindre l&apos;association.
              </p>
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
                <FormField
                  control={form.control}
                  name="associationName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <ReqLabel>Nom de l&apos;association</ReqLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className={inputFieldClass}
                          placeholder="Ex. : Association pour le développement local de Tillabéri"
                          autoComplete="organization"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-4 sm:gap-x-5 md:col-span-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <ReqLabel>Email</ReqLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isSubmitting}
                            className={inputFieldClass}
                            placeholder="contact@votre-association.ne"
                            type="email"
                            autoComplete="email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="min-w-0">
                        <ReqLabel>Mot de passe</ReqLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isSubmitting}
                            className={inputFieldClass}
                            placeholder="Au moins 8 caractères"
                            type="password"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <ReqLabel>Téléphone de contact</ReqLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className={inputFieldClass}
                          placeholder="+227 XX XX XX XX"
                          type="tel"
                          autoComplete="tel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className={sectionCardClass}>
              <SectionTitle step="4">Activité</SectionTitle>
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
                <FormField
                  control={form.control}
                  name="activityDomain"
                  render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Domaine d&apos;activité</ReqLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className={inputFieldClass}
                          placeholder="Ex. : santé communautaire, alphabétisation…"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prioritySectors"
                  render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Secteurs d&apos;activité prioritaires</ReqLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className={inputFieldClass}
                          placeholder="Ex. : eau, assainissement, petite enfance…"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className={sectionCardClass}>
              <SectionTitle step="5">Identité visuelle</SectionTitle>
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 md:gap-x-6 md:gap-y-5">
                <div className="space-y-2 md:col-span-2">
                  <StaticReqLabel htmlFor="register-association-logo">
                    Logo de l&apos;association (image)
                  </StaticReqLabel>
                  <p className={fieldHintClass}>JPG, PNG, WebP ou GIF — 10 Mo maximum.</p>
                  <div
                    className={cn(
                      "rounded-xl border border-dashed border-input/90 bg-muted/15 p-3 transition-colors",
                      "focus-within:border-primary/45 focus-within:bg-muted/25 focus-within:ring-2 focus-within:ring-ring/20"
                    )}
                  >
                    <Input
                      id="register-association-logo"
                      disabled={isSubmitting}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className={fileInputClassName}
                      onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <p className={fieldHintClass}>
                    {logoFile ? logoFile.name : "Aucun logo sélectionné"}
                  </p>
                  {logoPreviewUrl && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border/80 bg-muted/20 shadow-inner">
                      <Image
                        src={logoPreviewUrl}
                        alt="Prévisualisation du logo"
                        width={320}
                        height={180}
                        className="h-40 w-full object-contain p-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
              </div>

              <div className="mt-8 space-y-4 rounded-xl border border-border/80 bg-muted/20 p-5 md:p-6">
                <FormError message={error} />
                <FormSuccess message={success} />
                <Button
                  disabled={isSubmitting}
                  type="submit"
                  className="h-11 w-full gap-2 rounded-lg text-base font-semibold text-white shadow-md transition-opacity hover:opacity-95"
                  style={{
                    backgroundColor: appConfig.primaryColor,
                  }}
                >
                  {isSubmitting ? (
                    <span className="inline-flex flex-row items-center gap-2 text-sm leading-none">
                      <ProjectFadeLoader
                        loading
                        size="sm"
                        dimensions={{ height: 4, width: 2, radius: 1, margin: 1 }}
                        color="#ffffff"
                        className="shrink-0 leading-none [&>span]:!leading-none"
                      />
                      <span className="whitespace-nowrap leading-none">
                        Création en cours...
                      </span>
                    </span>
                  ) : (
                    "Soumettre la demande d\u2019inscription"
                  )}
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6 space-y-4 border-t border-border pt-6">
            <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Ou continuer avec
            </p>
            <Social />
            <BackButton href="/auth/login" label="Déjà un compte ?" />
          </div>
        </div>
      </div>
    </div>
  );
};