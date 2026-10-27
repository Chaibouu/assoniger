import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import appConfig from "@/settings";

/*
 * Thème commun des pages d'authentification (connexion, inscription).
 * Les couleurs de marque sont exposées en variables CSS sur la racine de la page :
 * --brand (vert), --brand-ring (halo de focus), --brand-tint (fond très léger), --accent (orange).
 */
export const authBrandVars = {
  "--brand": appConfig.primaryColor,
  "--brand-ring": `color-mix(in srgb, ${appConfig.primaryColor} 16%, transparent)`,
  "--brand-tint": `color-mix(in srgb, ${appConfig.primaryColor} 5%, white)`,
  "--accent": appConfig.secondaryColor,
} as CSSProperties;

/** Fond du bandeau photo : vert de marque foncé à gauche (lisibilité du texte), image visible à droite. */
export const authBannerGradient = `linear-gradient(100deg,
  color-mix(in srgb, ${appConfig.primaryColor} 94%, #000) 0%,
  color-mix(in srgb, ${appConfig.primaryColor} 78%, transparent) 46%,
  color-mix(in srgb, ${appConfig.primaryColor} 20%, transparent) 100%)`;

export const authInputClass = cn(
  "h-11 rounded-lg border-input bg-white px-3.5 text-sm text-foreground caret-[var(--brand)]",
  "shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-[border-color,box-shadow]",
  "hover:border-foreground/25",
  "focus-visible:border-[var(--brand)] focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)]"
);

export const authPrimaryButtonClass = cn(
  "h-12 gap-2 rounded-xl bg-[var(--brand)] px-7 text-base font-semibold text-white",
  "shadow-[0_8px_20px_-8px_color-mix(in_srgb,var(--brand)_70%,transparent)]",
  "hover:bg-[color-mix(in_srgb,var(--brand)_86%,black)]",
  "focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)] focus-visible:ring-offset-0"
);

export const authLinkClass =
  "font-semibold text-[var(--brand)] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)]";
