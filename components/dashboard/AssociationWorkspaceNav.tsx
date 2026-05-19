import Link from "next/link";
import { Home } from "lucide-react";
import appConfig from "@/settings";
import { cn } from "@/lib/utils";
import {
  adhesionAssociationPath,
  candidatAssociationPath,
  documentsAssociationPath,
  membresAssociationPath,
} from "@/lib/association-workspace-paths";

const ACCENT = appConfig.secondaryColor;

export type AssociationWorkspaceTabId =
  | "accueil"
  | "fiche"
  | "membres"
  | "demandes"
  | "documents"
  | "candidats";

export type AssociationWorkspaceNavCounts = {
  membres?: number;
  demandes?: number;
  documents?: number;
  candidats?: number;
};

export function AssociationWorkspaceNav({
  associationId,
  active,
  ficheHref,
  overviewHref,
  counts,
}: {
  associationId: string;
  active: AssociationWorkspaceTabId;
  ficheHref: string;
  overviewHref?: string;
  counts?: AssociationWorkspaceNavCounts;
}) {
  const tabs: {
    id: AssociationWorkspaceTabId;
    label: string;
    href: string;
    iconOnly?: boolean;
    countKey?: keyof AssociationWorkspaceNavCounts;
  }[] = [];

  if (overviewHref) {
    tabs.push({
      id: "accueil",
      label: "Vue d’ensemble",
      href: overviewHref,
      iconOnly: true,
    });
  }

  for (const t of [
    { id: "fiche" as const, label: "Fiche & infos", href: ficheHref },
    { id: "membres" as const, label: "Membres & bureau", href: membresAssociationPath(associationId) },
    { id: "demandes" as const, label: "Demandes d’adhésion", href: adhesionAssociationPath(associationId) },
    { id: "documents" as const, label: "Documents", href: documentsAssociationPath(associationId) },
    { id: "candidats" as const, label: "Candidat", href: candidatAssociationPath(associationId) },
  ]) {
    tabs.push({
      id: t.id,
      label: t.label,
      href: t.href,
      countKey:
        t.id === "membres"
          ? "membres"
          : t.id === "demandes"
            ? "demandes"
            : t.id === "documents"
              ? "documents"
              : t.id === "candidats"
                ? "candidats"
                : undefined,
    });
  }

  return (
    <div className="w-full overflow-hidden rounded-t-lg border border-border/80 bg-[#eceef1] dark:bg-muted/40">
      <nav
        className="flex w-full min-w-0 divide-x divide-neutral-300/90 dark:divide-border"
        aria-label="Sections de gestion de l’association"
        role="tablist"
      >
        {tabs.map((t) => {
          const isActive = t.id === active;
          const count =
            t.countKey !== undefined && counts && typeof counts[t.countKey] === "number"
              ? counts[t.countKey]
              : undefined;

          return (
            <Link
              key={t.id}
              href={t.href}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "relative flex min-h-[48px] items-center justify-center gap-1 border-neutral-300/90 text-center text-sm font-medium transition-colors dark:border-border",
                t.iconOnly
                  ? "w-[3.25rem] flex-none shrink-0 px-2 sm:w-14"
                  : "min-w-0 flex-1 px-1.5 py-2.5 sm:px-3",
                isActive
                  ? "z-[1] bg-background text-foreground dark:bg-card"
                  : "bg-transparent text-neutral-700 hover:bg-black/[0.03] hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted/30"
              )}
              style={
                isActive
                  ? {
                      color: ACCENT,
                      boxShadow: `inset 0 3px 0 0 ${ACCENT}, 0 1px 0 0 hsl(var(--background))`,
                    }
                  : undefined
              }
            >
              {t.iconOnly ? (
                <span className="flex flex-col items-center justify-center">
                  <Home className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                  <span className="sr-only">{t.label}</span>
                </span>
              ) : (
                <span className="line-clamp-2 leading-snug">{t.label}</span>
              )}
              {count !== undefined ? (
                <span
                  className={cn(
                    "ml-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums",
                    isActive
                      ? "bg-muted/90 text-foreground dark:bg-muted"
                      : "bg-white/90 text-neutral-600 dark:bg-background/60 dark:text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
