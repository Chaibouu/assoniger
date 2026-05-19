"use client";

import FadeLoader from "react-spinners/FadeLoader";
import appConfig from "@/settings";
import { cn } from "@/lib/utils";

export type ProjectFadeLoaderSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Dimensions des barres du FadeLoader (pixels). */
export type ProjectFadeLoaderDimensions = {
  height: number;
  width: number;
  radius: number;
  margin: number;
};

export interface ProjectFadeLoaderProps {
  /** Afficher ou masquer le spinner */
  loading?: boolean;
  /** Couleur des barres (défaut : primary du projet) */
  color?: string;
  className?: string;
  /** Overlay plein écran centré */
  fullScreen?: boolean;
  /** Accent secondaire (bordure du bloc en mode plein écran) */
  showSecondaryAccent?: boolean;
  /**
   * Preset de taille. Utiliser `dimensions` pour affiner au pixel près
   * selon le contexte (bouton, carte, plein écran, etc.).
   */
  size?: ProjectFadeLoaderSize;
  /** Surcharge partielle des dimensions (fusionnée avec le preset `size`). */
  dimensions?: Partial<ProjectFadeLoaderDimensions>;
  speedMultiplier?: number;
}

const sizeMap: Record<ProjectFadeLoaderSize, ProjectFadeLoaderDimensions> = {
  /** Boutons, lignes compactes */
  xs: { height: 6, width: 2, radius: 1, margin: 1 },
  sm: { height: 10, width: 4, radius: 2, margin: 2 },
  md: { height: 15, width: 5, radius: 2, margin: 2 },
  lg: { height: 20, width: 6, radius: 3, margin: 3 },
  /** Bouton principal / zone plus visible */
  xl: { height: 24, width: 7, radius: 3, margin: 4 },
};

function resolveDimensions(
  size: ProjectFadeLoaderSize,
  overrides?: Partial<ProjectFadeLoaderDimensions>
): ProjectFadeLoaderDimensions {
  const base = sizeMap[size] ?? sizeMap.md;
  if (!overrides) return base;
  return { ...base, ...overrides };
}

/**
 * Loader principal du projet (FadeLoader + couleurs {@link appConfig}).
 */
export function ProjectFadeLoader({
  loading = true,
  color = appConfig.primaryColor,
  className,
  fullScreen = false,
  showSecondaryAccent = true,
  size = "md",
  dimensions,
  speedMultiplier = 1,
}: ProjectFadeLoaderProps) {
  const dims = resolveDimensions(size, dimensions);

  const loader = (
    <FadeLoader
      loading={loading}
      color={color}
      speedMultiplier={speedMultiplier}
      height={dims.height}
      width={dims.width}
      radius={dims.radius}
      margin={dims.margin}
      aria-label="Chargement"
    />
  );

  if (!loading) {
    return null;
  }

  if (fullScreen) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px]",
          className
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className={cn(
            "flex flex-col items-center gap-5 rounded-xl border-2 bg-background/95 px-10 py-9 shadow-xl",
            !showSecondaryAccent && "border-border"
          )}
          style={
            showSecondaryAccent
              ? { borderColor: `${appConfig.secondaryColor}99` }
              : undefined
          }
        >
          {loader}
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
        <span className="sr-only">Chargement en cours</span>
      </div>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center justify-center align-middle", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {loader}
      <span className="sr-only">Chargement en cours</span>
    </span>
  );
}
