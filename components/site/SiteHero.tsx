"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, MapPin, Loader2 } from "lucide-react";
import appConfig from "@/settings";

type Props = {
  totalAssociations: number;
  totalMembers: number;
  totalRegions: number;
};

export function SiteHero({ totalAssociations, totalMembers, totalRegions }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<"login" | "signup" | null>(null);

  const handleNav = (key: "login" | "signup", href: string) => {
    if (loading) return;
    setLoading(key);
    router.push(href);
  };
  const stats = [
    {
      value: totalAssociations.toLocaleString("fr-FR"),
      label: "Associations actives",
      sub: "Enregistrées et vérifiées",
      icon: Building2,
    },
    {
      value: totalRegions.toLocaleString("fr-FR"),
      label: "Régions couvertes",
      sub: "Sur l'ensemble du territoire",
      icon: MapPin,
    },
    {
      value: totalMembers.toLocaleString("fr-FR"),
      label: "Membres référencés",
      sub: "À travers tout le Niger",
      icon: Users,
    },
  ];

  return (
    <section className="relative flex w-full flex-col justify-between overflow-hidden" style={{ minHeight: "calc(100vh - 4rem)" }} aria-labelledby="hero-heading">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')" }}
        aria-hidden="true"
      />

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.65) 60%, rgba(0,0,0,0.45) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative mx-auto w-full max-w-7xl flex-1 px-4 pt-8 md:px-8 md:pt-14">
        <div className="max-w-xl">
          {/* Heading */}
          <h1
            id="hero-heading"
            className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl md:text-5xl"
          >
            Le réseau national des associations du Niger
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-white/80">
            Connectons les acteurs du changement, renforçons l&apos;engagement citoyen
            et construisons ensemble un Niger plus solidaire, inclusif et prospère.
          </p>

          <p className="mt-3 text-sm font-medium text-white/60">
            Découvrez, soutenez ou enregistrez votre association dès aujourd&apos;hui.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => handleNav("login", "/auth/login")}
              disabled={loading !== null}
              className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{ color: appConfig.primaryColor }}
            >
              {loading === "login" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Se connecter
            </button>

            <button
              onClick={() => handleNav("signup", "/auth/signup")}
              disabled={loading !== null}
              className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-xl border-2 border-white/40 px-6 text-sm font-bold text-white backdrop-blur-sm transition-all duration-150 hover:border-white/70 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {loading === "signup" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Enregistrer mon association
            </button>
          </div>
        </div>

        {/* Stats bar — décollé du bas */}
        <div className="relative mb-8 mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 sm:px-7 sm:py-6"
              style={{ backgroundColor: "rgba(0,0,0,0.50)", backdropFilter: "blur(12px)" }}
            >
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${appConfig.secondaryColor}25` }}
              >
                <stat.icon className="h-5 w-5" style={{ color: appConfig.secondaryColor }} />
              </div>
              <div>
                <p
                  className="text-2xl font-black tabular-nums leading-none"
                  style={{ color: appConfig.secondaryColor }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-semibold text-white">{stat.label}</p>
                <p className="text-[11px] text-white/50">{stat.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
