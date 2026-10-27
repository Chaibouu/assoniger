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
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import appConfig from "@/settings";
import {
  authBannerGradient,
  authBrandVars,
  authInputClass,
  authLinkClass,
  authPrimaryButtonClass,
} from "@/components/auth/auth-theme";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  ImagePlus,
  Loader2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
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

/* Couleurs de marque en variables CSS (--brand, --brand-ring, --brand-tint, --accent) : voir auth-theme */
const inputFieldClass = authInputClass;

const fieldHintClass = "text-xs leading-relaxed text-muted-foreground";

const geoSelectClassNames: ClassNamesConfig<GeoSelectOption, false> = {
  control: (state) =>
    cn(
      "!min-h-11 h-11 w-full cursor-pointer rounded-lg border border-input bg-white px-1.5 text-sm",
      "shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-[border-color,box-shadow]",
      "hover:border-foreground/25",
      state.isFocused && "border-[var(--brand)] ring-4 ring-[var(--brand-ring)]",
      state.isDisabled && "cursor-not-allowed opacity-60"
    ),
  menu: () =>
    cn(
      "mt-1.5 overflow-hidden rounded-lg border border-border bg-white py-1 text-foreground",
      "shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]"
    ),
  menuList: () => "py-1 max-h-[280px]",
  option: (state) =>
    cn(
      "cursor-pointer px-3 py-2 text-sm",
      state.isFocused && "bg-[var(--brand-tint)]",
      state.isSelected && "font-semibold text-[var(--brand)]"
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

/** Marque « obligatoire » après le libellé (lue « obligatoire » par les lecteurs d'écran). */
function RequiredMark() {
  return (
    <>
      <span className="ml-0.5 text-[var(--accent)]" aria-hidden>
        *
      </span>
      <span className="sr-only"> (obligatoire)</span>
    </>
  );
}

/** Champ obligatoire : libellé + astérisque (dans un FormField) */
function ReqLabel({ children }: { children: ReactNode }) {
  return (
    <FormLabel className="text-sm font-medium leading-snug text-foreground">
      {children}
      <RequiredMark />
    </FormLabel>
  );
}

/** Libellé obligatoire pour champs hors react-hook-form (ex. fichier) */
function StaticReqLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium leading-snug text-foreground">
      {children}
      <RequiredMark />
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
  recognitionOrder: z
    .string()
    .trim()
    .min(2, "Le numéro de l'arrêté de reconnaissance est requis")
    .refine((v) => /\d{3,}/.test(v), "Le numéro doit contenir au moins 3 chiffres (ex. 000813)"),
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

/** Groupe de champs encadré, avec titre et courte explication ; grille 2 colonnes dès md. */
function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border border-border bg-white p-5 sm:p-7">
      <header className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-1.5 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </header>
      <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

type ArreteApiResponse = {
  fileId?: string;
  status?: "found" | "near" | "not_found";
  excerpt?: string;
  suggestion?: string;
  message?: string;
  error?: string;
};

/** Réponse de /api/public/validate-arrete-pdf, sans planter sur un corps non JSON (erreur serveur). */
async function readArreteResponse(res: Response): Promise<ArreteApiResponse> {
  const raw = await res.text();
  try {
    return raw ? (JSON.parse(raw) as ArreteApiResponse) : {};
  } catch {
    return {
      error:
        res.status >= 500
          ? "Le serveur a renvoyé une réponse invalide. Réessayez."
          : `Réponse inattendue du serveur (code ${res.status}). Réessayez.`,
    };
  }
}

function isAbortError(e: unknown) {
  return e instanceof Error && e.name === "AbortError";
}

function formatFileSize(bytes: number) {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`
    : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

/** Zone de dépôt de fichier : remplace le champ fichier natif, reste accessible au clavier. */
function FileDropField({
  id,
  accept,
  file,
  onFileChange,
  disabled,
  icon: Icon,
  emptyTitle,
  emptyHint,
}: {
  id: string;
  accept: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  icon: LucideIcon;
  emptyTitle: string;
  emptyHint: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        // relative : l'input masqué (sr-only, absolute) doit rester dans la zone de dépôt. Sinon il se
        // positionne par rapport au layout (overflow-hidden) et son focus fait défiler toute la page hors écran.
        "group relative flex cursor-pointer items-center gap-4 border-2 border-dashed p-4 transition-colors",
        "focus-within:border-[var(--brand)] focus-within:ring-4 focus-within:ring-[var(--brand-ring)]",
        file
          ? "border-[color-mix(in_srgb,var(--brand)_40%,transparent)] bg-[var(--brand-tint)]"
          : "border-border bg-muted/20 hover:border-[color-mix(in_srgb,var(--brand)_45%,transparent)] hover:bg-[var(--brand-tint)]",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-border",
          "shadow-[0_1px_2px_rgba(16,24,40,0.06)]",
          file ? "text-[var(--brand)]" : "text-muted-foreground group-hover:text-[var(--brand)]"
        )}
      >
        {file ? <CheckCircle2 className="h-5 w-5" aria-hidden /> : <Icon className="h-5 w-5" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">
          {file ? file.name : emptyTitle}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {file ? `${formatFileSize(file.size)} · cliquez pour remplacer` : emptyHint}
        </span>
      </span>
      <span
        className={cn(
          "hidden shrink-0 rounded-md border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground sm:inline",
          "transition-colors group-hover:border-[color-mix(in_srgb,var(--brand)_45%,transparent)]"
        )}
      >
        {file ? "Remplacer" : "Parcourir"}
      </span>
      {/* key : remonte l'input quand le fichier est retiré (après envoi) pour vider sa valeur */}
      <input
        key={file ? "selected" : "empty"}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only left-0 top-0"
        onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

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
    | { kind: "analyzing" }
    | { kind: "skipped" }
    | { kind: "short_ref" }
    | { kind: "loading" }
    | { kind: "valid"; excerpt?: string }
    | { kind: "near"; suggestion: string; excerpt?: string }
    | { kind: "invalid"; noText?: boolean }
    | { kind: "error"; message?: string };

  const [arretePdfCheck, setArretePdfCheck] = useState<ArretePdfCheckState>({ kind: "idle" });
  /** Pré-analyse du PDF (lancée dès la sélection) : identifiant du document analysé côté serveur */
  const [pdfAnalysis, setPdfAnalysis] = useState<
    | { state: "idle" }
    | { state: "analyzing" }
    | { state: "ready"; fileId: string; hasText: boolean }
    | { state: "error"; message: string }
  >({ state: "idle" });
  /** Incrémenté pour relancer l'analyse quand le serveur ne l'a plus en cache */
  const [pdfAnalysisNonce, setPdfAnalysisNonce] = useState(0);

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

  /* 1. Pré-analyse : le PDF est envoyé une seule fois, dès sa sélection, pendant que l'utilisateur
        saisit le numéro. Les vérifications suivantes n'envoient plus que le numéro. */
  useEffect(() => {
    if (!recognitionFile) {
      setPdfAnalysis({ state: "idle" });
      return;
    }

    const ac = new AbortController();
    setPdfAnalysis({ state: "analyzing" });
    void (async () => {
      try {
        const fd = new FormData();
        fd.append("file", recognitionFile);
        const res = await fetch("/api/public/validate-arrete-pdf", {
          method: "POST",
          body: fd,
          signal: ac.signal,
        });
        const data = await readArreteResponse(res);
        if (ac.signal.aborted) return;
        if (!res.ok || !data.fileId) {
          setPdfAnalysis({ state: "error", message: data.error ?? "Impossible de lire ce PDF." });
          return;
        }
        setPdfAnalysis({ state: "ready", fileId: data.fileId, hasText: !data.message });
      } catch (e) {
        if (ac.signal.aborted || isAbortError(e)) return;
        setPdfAnalysis({
          state: "error",
          message: "Connexion interrompue ou serveur injoignable. Réessayez.",
        });
      }
    })();

    return () => ac.abort();
  }, [recognitionFile, pdfAnalysisNonce]);

  /* 2. Vérification du numéro sur le document déjà analysé (réponse quasi instantanée). */
  useEffect(() => {
    if (!recognitionFile) {
      setArretePdfCheck({ kind: "idle" });
      return;
    }
    if (pdfAnalysis.state === "analyzing" || pdfAnalysis.state === "idle") {
      setArretePdfCheck({ kind: "analyzing" });
      return;
    }
    if (pdfAnalysis.state === "error") {
      setArretePdfCheck({ kind: "error", message: pdfAnalysis.message });
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

    const { fileId, hasText } = pdfAnalysis;
    const ac = new AbortController();
    setArretePdfCheck({ kind: "loading" });
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch("/api/public/validate-arrete-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileId, recognitionOrder: order }),
            signal: ac.signal,
          });
          const data = await readArreteResponse(res);
          if (ac.signal.aborted) return;

          // Analyse expirée côté serveur : on renvoie le fichier une fois
          if (res.status === 410) {
            setPdfAnalysisNonce((n) => n + 1);
            return;
          }
          if (!res.ok) {
            setArretePdfCheck({ kind: "error", message: data.error ?? "Impossible de vérifier le PDF" });
            return;
          }
          if (data.status === "found") {
            setArretePdfCheck({ kind: "valid", excerpt: data.excerpt });
          } else if (data.status === "near" && data.suggestion) {
            setArretePdfCheck({ kind: "near", suggestion: data.suggestion, excerpt: data.excerpt });
          } else {
            setArretePdfCheck({ kind: "invalid", noText: !hasText });
          }
        } catch (e) {
          if (ac.signal.aborted || isAbortError(e)) return;
          setArretePdfCheck({
            kind: "error",
            message: "Connexion interrompue ou serveur injoignable. Réessayez.",
          });
        }
      })();
    }, 300);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [recognitionFile, pdfAnalysis, watchedRecognitionOrder]);

  const onSubmit = async (values: RegisterValues) => {
    setError("");
    setSuccess("");

    if (values.accountType === "association") {
      if (!recognitionFile) {
        setError("Le document de l'arrêté de reconnaissance est requis");
        return;
      }
      // Numéro obligatoire (validé par le schéma) : il doit avoir été retrouvé dans le PDF
      if (
        arretePdfCheck.kind === "loading" ||
        arretePdfCheck.kind === "analyzing" ||
        arretePdfCheck.kind === "idle"
      ) {
        setError("Vérification du PDF en cours — patientez un instant avant de soumettre.");
        return;
      }
      if (arretePdfCheck.kind === "near") {
        setError(
          `Le numéro saisi ne correspond pas au document, qui indique « ${arretePdfCheck.suggestion} ». Corrigez votre saisie.`
        );
        return;
      }
      if (arretePdfCheck.kind !== "valid") {
        setError(
          "Le numéro de l'arrêté doit être retrouvé dans le PDF téléchargé. Corrigez le numéro ou le document."
        );
        return;
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

  const geoSelectCommon = {
    unstyled: true,
    classNames: geoSelectClassNames,
    styles: geoSelectStyles,
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed" as const,
    isClearable: false,
    isSearchable: true,
  };

  return (
    <div
      id="signup-scroll"
      className="h-full overflow-y-auto overscroll-y-contain bg-[#F5F2EC] selection:bg-[var(--brand)] selection:text-white"
      style={authBrandVars}
    >
      <div className="mx-auto w-full max-w-4xl px-3 pb-16 pt-4 sm:px-6 sm:pt-10">
        <div className="overflow-hidden bg-white shadow-[0_28px_70px_-32px_rgba(3,40,28,0.45)] ring-1 ring-black/5">
          {/* ─── Bandeau ─────────────────────────────────────────────────────── */}
          <header className="relative isolate overflow-hidden">
            <Image
              src="/background.png"
              alt=""
              fill
              priority
              sizes="(min-width: 896px) 896px, 100vw"
              className="-z-20 object-cover object-[center_60%]"
            />
            <div aria-hidden className="absolute inset-0 -z-10" style={{ background: authBannerGradient }} />
            <div className="flex items-center gap-6 px-6 py-9 sm:px-10 sm:py-12">
              <div className="min-w-0 flex-1">
                <h1 className="text-balance text-[1.875rem] font-bold leading-[1.1] tracking-tight text-white sm:text-[2.75rem]">
                  Inscription d&apos;une association
                </h1>
                <p className="mt-3 max-w-[52ch] text-pretty text-sm leading-relaxed text-white/90 sm:text-base">
                  Remplissez le formulaire ci-dessous pour inscrire votre association sur la plateforme.
                  Chaque dossier est vérifié par notre équipe avant activation.
                </p>
              </div>
              <div className="hidden shrink-0 rounded-2xl bg-white p-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.45)] sm:block">
                <Image
                  src={appConfig.logoUrl}
                  alt={appConfig.appName}
                  width={104}
                  height={104}
                  className="h-[5.5rem] w-[5.5rem] object-contain"
                  priority
                />
              </div>
            </div>
          </header>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5 bg-[#FBFAF7] px-3 py-6 sm:space-y-6 sm:px-8 sm:py-8"
              noValidate
            >
              <p className="px-1 text-sm text-muted-foreground">
                Les champs marqués d&apos;un <span className="text-[var(--accent)]">*</span> sont obligatoires.
              </p>

              {/* ─── L'association ──────────────────────────────────────────── */}
              <FormSection
                title="L'association"
                description="L'email et le mot de passe donnent accès au tableau de bord de l'association : ce n'est pas un compte personnel."
              >
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
                <FormField
                  control={form.control}
                  name="presidentName"
                  render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Nom complet du président</ReqLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className={inputFieldClass}
                          placeholder="Prénom Nom"
                          autoComplete="name"
                        />
                      </FormControl>
                      <p className={fieldHintClass}>Tel qu&apos;il figurera sur la fiche de l&apos;association.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
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
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Adresse email</ReqLabel>
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
                    <FormItem>
                      <ReqLabel>Mot de passe</ReqLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className={inputFieldClass}
                          placeholder="8 caractères minimum"
                          type="password"
                          autoComplete="new-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormSection>

              {/* ─── Localisation ───────────────────────────────────────────── */}
              <FormSection title="Localisation" description="Où se trouve le siège de l'association.">
                {(geoErrorMessage || geoEmptyHint) && (
                  <div
                    role="alert"
                    className={cn(
                      "border px-3.5 py-3 text-sm leading-snug md:col-span-2",
                      geoErrorMessage
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : "border-amber-500/35 bg-amber-500/10 text-amber-950"
                    )}
                  >
                    {geoErrorMessage ?? geoEmptyHint}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="regionId"
                  render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Région</ReqLabel>
                      <FormControl>
                        <Select<GeoSelectOption, false>
                          {...geoSelectCommon}
                          instanceId="register-region"
                          name={field.name}
                          ref={field.ref}
                          placeholder="Choisir une région"
                          options={regionSelectOptions}
                          value={regionSelectOptions.find((o) => o.value === field.value) ?? null}
                          onChange={(opt: SingleValue<GeoSelectOption>) => {
                            field.onChange(opt?.value ?? "");
                            form.setValue("departementId", "");
                            form.setValue("communeId", "");
                          }}
                          onBlur={field.onBlur}
                          isLoading={geoRegionsLoading}
                          isDisabled={isSubmitting || geoRegionsLoading}
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
                          {...geoSelectCommon}
                          instanceId="register-departement"
                          name={field.name}
                          ref={field.ref}
                          placeholder={watchedRegionId ? "Choisir un département" : "Choisissez d’abord une région"}
                          options={departementSelectOptions}
                          value={departementSelectOptions.find((o) => o.value === field.value) ?? null}
                          onChange={(opt: SingleValue<GeoSelectOption>) => {
                            field.onChange(opt?.value ?? "");
                            form.setValue("communeId", "");
                          }}
                          onBlur={field.onBlur}
                          isLoading={geoDepartementsLoading}
                          isDisabled={isSubmitting || !watchedRegionId || geoDepartementsLoading}
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
                    <FormItem>
                      <ReqLabel>Commune</ReqLabel>
                      <FormControl>
                        <Select<GeoSelectOption, false>
                          {...geoSelectCommon}
                          instanceId="register-commune"
                          name={field.name}
                          ref={field.ref}
                          placeholder={watchedDepartementId ? "Choisir une commune" : "Choisissez d’abord un département"}
                          options={communeSelectOptions}
                          value={communeSelectOptions.find((o) => o.value === field.value) ?? null}
                          onChange={(opt: SingleValue<GeoSelectOption>) => field.onChange(opt?.value ?? "")}
                          onBlur={field.onBlur}
                          isLoading={geoCommunesLoading}
                          isDisabled={isSubmitting || !watchedDepartementId || geoCommunesLoading}
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
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <ReqLabel>Adresse</ReqLabel>
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
              </FormSection>

              {/* ─── Activité ───────────────────────────────────────────────── */}
              <FormSection title="Activité">
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
                      <ReqLabel>Secteurs prioritaires</ReqLabel>
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
              </FormSection>

              {/* ─── Documents officiels ────────────────────────────────────── */}
              <FormSection
                title="Documents officiels"
                description="L'arrêté de reconnaissance est obligatoire pour l'examen du dossier ; le logo est facultatif."
              >
                <FormField
                  control={form.control}
                  name="recognitionOrder"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <ReqLabel>Numéro de l&apos;arrêté de reconnaissance</ReqLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          className={inputFieldClass}
                          placeholder="Ex. : 000813 ou 000813/MI/SP/D/DGAPJ"
                        />
                      </FormControl>
                      <p className={fieldHintClass}>
                        Tel qu&apos;il figure sur l&apos;arrêté : il est vérifié automatiquement dans le PDF
                        ajouté ci-dessous.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2 md:col-span-2">
                  <StaticReqLabel htmlFor="register-recognition-pdf">
                    Arrêté de reconnaissance (PDF)
                  </StaticReqLabel>
                  <FileDropField
                    id="register-recognition-pdf"
                    accept="application/pdf"
                    file={recognitionFile}
                    onFileChange={setRecognitionFile}
                    disabled={isSubmitting}
                    icon={FileText}
                    emptyTitle="Choisir le fichier PDF de l'arrêté"
                    emptyHint="PDF uniquement · 10 Mo maximum"
                  />
                  {recognitionFile && (
                    <div
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "flex items-start gap-2.5 border px-3.5 py-3 text-sm leading-snug",
                        arretePdfCheck.kind === "valid" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-950",
                        arretePdfCheck.kind === "invalid" && "border-destructive/40 bg-destructive/10 text-destructive",
                        arretePdfCheck.kind === "near" && "border-amber-500/45 bg-amber-500/10 text-amber-950",
                        (arretePdfCheck.kind === "loading" || arretePdfCheck.kind === "analyzing") &&
                          "border-border bg-white text-foreground",
                        (arretePdfCheck.kind === "skipped" ||
                          arretePdfCheck.kind === "short_ref" ||
                          arretePdfCheck.kind === "idle") &&
                          "border-border bg-white text-muted-foreground",
                        arretePdfCheck.kind === "error" && "border-destructive/35 bg-destructive/10 text-destructive"
                      )}
                    >
                      {arretePdfCheck.kind === "analyzing" && (
                        <>
                          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden />
                          <span>Lecture du document… Vous pouvez continuer à remplir le formulaire.</span>
                        </>
                      )}
                      {arretePdfCheck.kind === "loading" && (
                        <>
                          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden />
                          <span>Recherche du numéro dans le document…</span>
                        </>
                      )}
                      {arretePdfCheck.kind === "valid" && (
                        <>
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                          <span className="min-w-0">
                            <strong className="text-foreground">Numéro retrouvé dans le document.</strong>
                            {arretePdfCheck.excerpt && (
                              <span className="mt-1 block break-words text-xs text-emerald-900/80">
                                Extrait : « {arretePdfCheck.excerpt} »
                              </span>
                            )}
                          </span>
                        </>
                      )}
                      {arretePdfCheck.kind === "near" && (
                        <>
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                          <span className="min-w-0">
                            <strong className="text-foreground">Le numéro ne correspond pas exactement.</strong> Le
                            document indique{" "}
                            <strong className="text-foreground">« {arretePdfCheck.suggestion} »</strong> :
                            vérifiez votre saisie.
                            {arretePdfCheck.excerpt && (
                              <span className="mt-1 block break-words text-xs text-amber-900/80">
                                Extrait : « {arretePdfCheck.excerpt} »
                              </span>
                            )}
                          </span>
                        </>
                      )}
                      {arretePdfCheck.kind === "invalid" && (
                        <>
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          <span>
                            {arretePdfCheck.noText ? (
                              <>
                                <strong className="text-foreground">Document illisible</strong> : aucun texte n&apos;a
                                pu être lu dans ce PDF. Utilisez un scan plus net ou un autre export.
                              </>
                            ) : (
                              <>
                                <strong className="text-foreground">Numéro introuvable</strong> à côté de la mention
                                « Arrêté n° » du document. Saisissez le numéro tel qu&apos;il apparaît sur
                                l&apos;arrêté (ex. <code className="rounded bg-muted px-1">000813</code> ou{" "}
                                <code className="rounded bg-muted px-1">000813/MI/SP/D/DGAPJ</code>).
                              </>
                            )}
                          </span>
                        </>
                      )}
                      {arretePdfCheck.kind === "skipped" && (
                        <span>
                          Document prêt. Renseignez le numéro de l&apos;arrêté ci-dessus pour le vérifier.
                        </span>
                      )}
                      {arretePdfCheck.kind === "short_ref" && (
                        <span>Saisissez au moins 2 caractères dans le numéro pour lancer la vérification.</span>
                      )}
                      {arretePdfCheck.kind === "idle" && <span>Préparation de la vérification…</span>}
                      {arretePdfCheck.kind === "error" && (
                        <>
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                          <span>
                            Lecture du PDF impossible
                            {arretePdfCheck.message ? ` : ${arretePdfCheck.message}` : ""}.
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="register-association-logo"
                    className="block text-sm font-medium leading-snug text-foreground"
                  >
                    Logo de l&apos;association
                    <span className="ml-1.5 font-normal text-muted-foreground">(facultatif)</span>
                  </label>
                  <div className="flex items-stretch gap-3">
                    {logoPreviewUrl && (
                      <div className="flex w-[4.75rem] shrink-0 items-center justify-center border border-border bg-white p-1.5">
                        <Image
                          src={logoPreviewUrl}
                          alt="Aperçu du logo"
                          width={72}
                          height={72}
                          className="h-16 w-16 object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <FileDropField
                        id="register-association-logo"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        file={logoFile}
                        onFileChange={setLogoFile}
                        disabled={isSubmitting}
                        icon={ImagePlus}
                        emptyTitle="Choisir l'image du logo"
                        emptyHint="JPG, PNG, WebP ou GIF · 10 Mo maximum"
                      />
                    </div>
                  </div>
                </div>
              </FormSection>

              {/* ─── Envoi ──────────────────────────────────────────────────── */}
              <div className="space-y-4 px-1 pt-1">
                <FormError message={error} />
                <FormSuccess message={success} />
                <div className="flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-center text-sm text-muted-foreground sm:text-left">
                    Déjà inscrit ?{" "}
                    <Link href="/auth/login" className={authLinkClass}>
                      Se connecter
                    </Link>
                  </p>
                  <Button
                    disabled={isSubmitting}
                    type="submit"
                    className={authPrimaryButtonClass}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        Envoyer la demande
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
