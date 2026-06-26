"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Building2, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
import appConfig from "@/settings";

type PublicAssociation = {
  id: string;
  name: string;
  acronym: string | null;
  description: string;
  regionLabel: string;
  logoUrl: string | null;
};

function shortText(value: string, max = 90) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}…`;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white"
      style={{ backgroundColor: appConfig.primaryColor }}
    >
      {initials}
    </div>
  );
}

export function SiteAssociations({ associations }: { associations: PublicAssociation[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  };

  return (
    <section id="associations" className="w-full overflow-hidden bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 pt-20 md:px-8 md:pt-28">

        {/* Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span
              className="mb-3 inline-block text-xs font-bold uppercase tracking-widest"
              style={{ color: appConfig.primaryColor }}
            >
              Annuaire
            </span>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
              Associations en{" "}
              <span style={{ color: appConfig.secondaryColor }}>vedette</span>
            </h2>
            {/* Decorative divider */}
            <div className="mt-4 flex items-center gap-3">
              <div className="h-px w-12 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
              <div className="h-px w-12 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
              Organisations actives et visibles publiquement sur la plateforme.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll arrows */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-150 hover:text-white"
                style={{ transition: "background-color 150ms, color 150ms" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = appConfig.primaryColor; (e.currentTarget as HTMLElement).style.borderColor = appConfig.primaryColor; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; }}
                aria-label="Défiler à gauche"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all duration-150"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = appConfig.primaryColor; (e.currentTarget as HTMLElement).style.borderColor = appConfig.primaryColor; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLElement).style.color = "#6b7280"; }}
                aria-label="Défiler à droite"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Voir tout */}
            <Link
              href="/associations"
              className="flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity duration-150 hover:opacity-90"
              style={{ backgroundColor: appConfig.primaryColor }}
            >
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll container */}
      {associations.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 pb-20 md:px-8 md:pb-28">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-16 text-center">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">Aucune association disponible pour le moment.</p>
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-4 overflow-x-auto pb-20 md:pb-28"
          style={{
            paddingLeft: "max(1rem, calc((100vw - 80rem) / 2 + 2rem))",
            paddingRight: "max(1rem, calc((100vw - 80rem) / 2 + 2rem))",
          }}
        >
          {associations.map((assoc, i) => (
            <Link
              key={assoc.id}
              href={`/associations/${assoc.id}`}
              className="group relative flex w-[300px] shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl focus-visible:outline-none"
            >
              {/* Top accent bar */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: i % 2 === 0 ? appConfig.primaryColor : appConfig.secondaryColor }}
              />

              <div className="flex flex-1 flex-col p-6">
                {/* Logo + name */}
                <div className="mb-4 flex items-start gap-3">
                  {assoc.logoUrl ? (
                    <img src={assoc.logoUrl} alt={assoc.name} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                  ) : (
                    <Avatar name={assoc.name} />
                  )}
                  <div className="min-w-0 pt-1">
                    <h3 className="line-clamp-2 text-sm font-bold leading-snug text-gray-900">
                      {assoc.name}
                    </h3>
                    {assoc.acronym && (
                      <span
                        className="mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{ backgroundColor: i % 2 === 0 ? appConfig.primaryColor : appConfig.secondaryColor }}
                      >
                        {assoc.acronym}
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="flex-1 text-sm leading-relaxed text-gray-500">
                  {shortText(assoc.description)}
                </p>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {assoc.regionLabel || "Niger"}
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs font-bold transition-all duration-150 group-hover:gap-2"
                    style={{ color: i % 2 === 0 ? appConfig.primaryColor : appConfig.secondaryColor }}
                  >
                    Voir le profil
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
