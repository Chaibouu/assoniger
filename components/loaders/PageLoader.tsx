"use client";

import { ProjectFadeLoader } from "@/components/loaders/ProjectFadeLoader";
import appConfig from "@/settings";

/**
 * Loader pleine hauteur centré — utilisé dans les fichiers loading.tsx
 * et les Suspense fallbacks au niveau des pages/routes.
 */
export function PageLoader({ label = "Chargement..." }: { label?: string }) {
  return (
    <div
      className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <ProjectFadeLoader size="lg" color={appConfig.primaryColor} />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

/**
 * Loader plein écran absolu — utilisé dans le dashboard layout
 * pendant la vérification de session (évite le flash null).
 */
export function FullPageLoader({ label = "Chargement..." }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <ProjectFadeLoader size="xl" color={appConfig.primaryColor} />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
