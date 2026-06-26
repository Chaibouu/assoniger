"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, MapPin, ArrowRight, Building2,
  LayoutGrid, List, ChevronLeft, ChevronRight, X, Plus, SlidersHorizontal,
} from "lucide-react";
import appConfig from "@/settings";

type Association = {
  id: string;
  name: string;
  acronym: string | null;
  description: string;
  logoUrl: string | null;
  legalStatus: string;
  totalMembers: number | null;
  region: { name: string; code: string } | null;
  domains: { domainId: string; domain: { name: string } }[];
};

type Region = { id: string; name: string; code: string };
type Domain = { id: string; name: string };

const DOMAIN_COLORS: Record<string, { bg: string; text: string }> = {
  Éducation:     { bg: "#eff6ff", text: "#1d4ed8" },
  Santé:         { bg: "#f0fdf4", text: "#15803d" },
  Environnement: { bg: "#ecfdf5", text: "#065f46" },
  Culture:       { bg: "#fdf4ff", text: "#7e22ce" },
  Sport:         { bg: "#fff7ed", text: "#c2410c" },
  Social:        { bg: "#fefce8", text: "#854d0e" },
  Économie:      { bg: "#fff1f2", text: "#be123c" },
  Jeunesse:      { bg: "#eff6ff", text: "#1e40af" },
};

function domainColor(name: string) {
  return DOMAIN_COLORS[name] ?? { bg: "#f3f4f6", text: "#374151" };
}

const PAGE_SIZE = 9;

export function AssociationsGrid({
  associations,
  regions,
  domains,
  total,
}: {
  associations: Association[];
  regions: Region[];
  domains: Domain[];
  total: number;
}) {
  const [search, setSearch]           = useState("");
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDomain, setSelectedDomain]   = useState<string | null>(null);
  const [view, setView]               = useState<"grid" | "list">("grid");
  const [page, setPage]               = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const toggleRegion = (name: string) => {
    setPage(1);
    setSelectedRegions((prev) =>
      prev.includes(name) ? prev.filter((r) => r !== name) : [...prev, name]
    );
  };

  const filtered = useMemo(() => {
    return associations.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        a.name.toLowerCase().includes(q) ||
        (a.acronym?.toLowerCase().includes(q) ?? false) ||
        a.description.toLowerCase().includes(q);
      const matchRegion =
        selectedRegions.length === 0 ||
        (a.region != null && selectedRegions.includes(a.region.name));
      const matchDomain =
        !selectedDomain ||
        a.domains.some((d) => d.domain.name === selectedDomain);
      return matchSearch && matchRegion && matchDomain;
    });
  }, [associations, search, selectedRegions, selectedDomain]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = !!(search || selectedRegions.length > 0 || selectedDomain);

  const resetAll = () => {
    setSearch("");
    setSelectedRegions([]);
    setSelectedDomain(null);
    setPage(1);
  };

  const pageNumbers = (): (number | "…")[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, "…", totalPages];
    if (page >= totalPages - 2) return [1, "…", totalPages - 2, totalPages - 1, totalPages];
    return [1, "…", page - 1, page, page + 1, "…", totalPages];
  };

  return (
    <div className="flex flex-1 flex-col items-start bg-gray-50 lg:flex-row">

      {/* ── Mobile filter bar ── */}
      <div className="w-full border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:bg-white"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition hover:border-gray-300"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {(selectedRegions.length > 0 || selectedDomain) && (
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: appConfig.primaryColor }}
              >
                {selectedRegions.length + (selectedDomain ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Mobile filter panel */}
        {mobileFiltersOpen && (
          <div className="mt-3 flex flex-col gap-4 border-t border-gray-100 pt-3">
            {/* Regions */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Région</p>
              <div className="flex flex-wrap gap-2">
                {regions.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => toggleRegion(r.name)}
                    className="rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150"
                    style={
                      selectedRegions.includes(r.name)
                        ? { backgroundColor: appConfig.primaryColor, borderColor: appConfig.primaryColor, color: "#fff" }
                        : { borderColor: "#e5e7eb", color: "#4b5563", backgroundColor: "#fff" }
                    }
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Domains */}
            {domains.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Domaine</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setSelectedDomain(null); setPage(1); }}
                    className="rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150"
                    style={
                      selectedDomain === null
                        ? { backgroundColor: appConfig.primaryColor, borderColor: appConfig.primaryColor, color: "#fff" }
                        : { borderColor: "#e5e7eb", color: "#4b5563", backgroundColor: "#fff" }
                    }
                  >
                    Tous
                  </button>
                  {domains.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => { setSelectedDomain(d.name); setPage(1); }}
                      className="rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150"
                      style={
                        selectedDomain === d.name
                          ? { backgroundColor: appConfig.primaryColor, borderColor: appConfig.primaryColor, color: "#fff" }
                          : { borderColor: "#e5e7eb", color: "#4b5563", backgroundColor: "#fff" }
                      }
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 pt-2">
              <button
                onClick={() => { resetAll(); setMobileFiltersOpen(false); }}
                className="cursor-pointer text-xs font-medium text-red-500 hover:text-red-700"
              >
                Tout effacer
              </button>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-white"
                style={{ backgroundColor: appConfig.primaryColor }}
              >
                Appliquer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sidebar ── */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div
          className="sticky flex flex-col gap-6 border-r border-gray-200 bg-white p-5"
          style={{ top: "4rem", height: "calc(100vh - 4rem)", overflowY: "auto" }}
        >
          {/* Titre filtres */}
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Filtres</p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-9 w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:bg-white"
            />
            {search && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Regions */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Région</p>
            <ul className="flex flex-col gap-2.5">
              {regions.map((r) => (
                <li key={r.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedRegions.includes(r.name)}
                      onChange={() => toggleRegion(r.name)}
                      className="h-4 w-4 cursor-pointer rounded border-gray-300"
                      style={{ accentColor: appConfig.primaryColor }}
                    />
                    {r.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>

          {/* Separator */}
          <div className="h-px bg-gray-100" />

          {/* Domains */}
          {domains.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Domaine</p>
              <ul className="flex flex-col gap-2.5">
                <li>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900">
                    <input
                      type="radio"
                      checked={selectedDomain === null}
                      onChange={() => { setSelectedDomain(null); setPage(1); }}
                      className="h-4 w-4 cursor-pointer"
                      style={{ accentColor: appConfig.primaryColor }}
                    />
                    Tous
                  </label>
                </li>
                {domains.map((d) => (
                  <li key={d.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900">
                      <input
                        type="radio"
                        checked={selectedDomain === d.name}
                        onChange={() => { setSelectedDomain(d.name); setPage(1); }}
                        className="h-4 w-4 cursor-pointer"
                        style={{ accentColor: appConfig.primaryColor }}
                      />
                      {d.name}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* CTA */}
          <Link
            href="/auth/signup"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-opacity duration-150 hover:opacity-90"
            style={{ backgroundColor: appConfig.secondaryColor }}
          >
            <Plus className="h-4 w-4" />
            Ajouter une Association
          </Link>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex min-w-0 w-full flex-1 flex-col lg:w-auto">

        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-4 py-4 md:px-6 md:py-5">
          {/* Breadcrumb */}
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/" className="cursor-pointer transition-colors hover:text-gray-600">Accueil</Link>
            <span>/</span>
            <span className="font-semibold" style={{ color: appConfig.primaryColor }}>Explorer</span>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Exploration des Associations</h1>
              <p className="mt-1 max-w-xl text-xs text-gray-500 sm:text-sm">
                Découvrez les organisations qui façonnent l&apos;avenir du Niger.
                Filtrez par région ou domaine pour trouver des partenaires locaux.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{filtered.length}</span> résultat{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
              </span>
              <div className="flex overflow-hidden rounded-lg border border-gray-200">
                <button
                  onClick={() => setView("grid")}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center transition-colors duration-150"
                  style={view === "grid" ? { backgroundColor: appConfig.primaryColor, color: "#fff" } : { backgroundColor: "#fff", color: "#9ca3af" }}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setView("list")}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center border-l border-gray-200 transition-colors duration-150"
                  style={view === "list" ? { backgroundColor: appConfig.primaryColor, color: "#fff" } : { backgroundColor: "#fff", color: "#9ca3af" }}
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {hasFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {selectedRegions.map((r) => (
                <span key={r} className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {r}
                  <button onClick={() => toggleRegion(r)} className="cursor-pointer text-gray-400 hover:text-gray-700"><X className="h-3 w-3" /></button>
                </span>
              ))}
              {selectedDomain && (
                <span className="flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {selectedDomain}
                  <button onClick={() => { setSelectedDomain(null); setPage(1); }} className="cursor-pointer text-gray-400 hover:text-gray-700"><X className="h-3 w-3" /></button>
                </span>
              )}
              <button onClick={resetAll} className="cursor-pointer text-xs font-medium text-red-500 hover:text-red-700">Tout effacer</button>
            </div>
          )}
        </div>

        {/* Cards area */}
        <div className="p-4 md:p-6">
          {paginated.length === 0 ? (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
              <Building2 className="h-10 w-10 text-gray-300" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Aucune association trouvée</p>
                <p className="mt-1 text-sm text-gray-500">Modifiez vos filtres pour voir plus de résultats.</p>
              </div>
              <button onClick={resetAll} className="mt-1 cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-300">
                Réinitialiser
              </button>
            </div>
          ) : view === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {paginated.map((assoc) => <AssocCard key={assoc.id} assoc={assoc} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {paginated.map((assoc) => <AssocRow key={assoc.id} assoc={assoc} />)}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 border-t border-gray-200 bg-white px-6 py-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {pageNumbers().map((n, i) =>
              n === "…" ? (
                <span key={`el-${i}`} className="flex h-8 w-8 items-center justify-center text-sm text-gray-400">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n as number)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-all duration-150"
                  style={
                    page === n
                      ? { backgroundColor: appConfig.primaryColor, color: "#fff", borderColor: appConfig.primaryColor }
                      : { borderColor: "#e5e7eb", color: "#374151" }
                  }
                >
                  {n}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Card grid view ── */
function AssocCard({ assoc }: { assoc: Association }) {
  const primaryDomain = assoc.domains[0]?.domain.name;
  const dc = primaryDomain ? domainColor(primaryDomain) : null;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg">
      <div className="relative flex items-start justify-between p-5 pb-3">
        {assoc.logoUrl ? (
          <img src={assoc.logoUrl} alt={assoc.name} className="h-14 w-14 rounded-2xl object-cover" />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-bold text-white"
            style={{ backgroundColor: appConfig.primaryColor }}
          >
            {assoc.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
          </div>
        )}
        {primaryDomain && dc && (
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: dc.bg, color: dc.text }}>
            {primaryDomain}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5">
        <h2 className="text-base font-bold leading-snug text-gray-900 line-clamp-2">{assoc.name}</h2>
        {assoc.region && (
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
            <MapPin className="h-3 w-3" />{assoc.region.name}, Niger
          </p>
        )}
        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500 line-clamp-3">{assoc.description}</p>

        {assoc.domains.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {assoc.domains.slice(1).map((d) => {
              const c = domainColor(d.domain.name);
              return (
                <span key={d.domainId} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
                  {d.domain.name}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="text-xs text-gray-400">
            {assoc.totalMembers ? `${assoc.totalMembers} membres` : ""}
          </span>
          <Link
            href={`/associations/${assoc.id}`}
            className="flex cursor-pointer items-center gap-1 text-sm font-semibold transition-colors duration-150 hover:underline"
            style={{ color: appConfig.primaryColor }}
          >
            Voir détails <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Row list view ── */
function AssocRow({ assoc }: { assoc: Association }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:shadow-md">
      {assoc.logoUrl ? (
        <img src={assoc.logoUrl} alt={assoc.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: appConfig.primaryColor }}>
          {assoc.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-sm font-bold text-gray-900">{assoc.name}</h2>
          {assoc.acronym && (
            <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: appConfig.primaryColor }}>{assoc.acronym}</span>
          )}
        </div>
        {assoc.region && (
          <p className="flex items-center gap-1 text-xs text-gray-400"><MapPin className="h-3 w-3" />{assoc.region.name}</p>
        )}
        <p className="mt-0.5 truncate text-xs text-gray-500">{assoc.description}</p>
      </div>
      <div className="hidden shrink-0 flex-wrap gap-1 sm:flex">
        {assoc.domains.slice(0, 2).map((d) => {
          const c = domainColor(d.domain.name);
          return <span key={d.domainId} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: c.bg, color: c.text }}>{d.domain.name}</span>;
        })}
      </div>
      <Link href={`/associations/${assoc.id}`} className="flex shrink-0 cursor-pointer items-center gap-1 text-sm font-semibold transition-colors hover:underline" style={{ color: appConfig.primaryColor }}>
        <span className="hidden sm:inline">Voir détails</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
