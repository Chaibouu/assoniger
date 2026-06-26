import { BookOpen, HandHeart, ShieldCheck, MapPin, Bell, Users } from "lucide-react";
import appConfig from "@/settings";

const features = [
  {
    icon: BookOpen,
    title: "Profil public complet",
    description: "Statuts, contacts, zone d'intervention, équipe dirigeante — tout en un seul endroit.",
    accent: appConfig.primaryColor,
  },
  {
    icon: HandHeart,
    title: "Appels à contribution",
    description: "Publiez des besoins en bénévolat, dons, matériel ou services et mobilisez votre réseau.",
    accent: appConfig.secondaryColor,
  },
  {
    icon: ShieldCheck,
    title: "Documents officiels",
    description: "Centralisez statuts, récépissés et documents fiscaux. Gagnez en crédibilité.",
    accent: appConfig.primaryColor,
  },
  {
    icon: MapPin,
    title: "Ancrage territorial",
    description: "Régions, départements, communes — votre rayonnement géographique est clairement défini.",
    accent: appConfig.secondaryColor,
  },
  {
    icon: Bell,
    title: "Événements & projets",
    description: "Annoncez vos réunions, formations et projets en cours auprès de votre communauté.",
    accent: appConfig.primaryColor,
  },
  {
    icon: Users,
    title: "Gestion des membres",
    description: "Gérez votre bureau et vos membres en toute transparence depuis votre espace dédié.",
    accent: appConfig.secondaryColor,
  },
];

export function SiteFeatures() {
  return (
    <section className="w-full bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 md:py-28">

        {/* Header */}
        <div className="mb-14 text-center">
          <span
            className="mb-4 inline-block text-xs font-bold uppercase tracking-widest"
            style={{ color: appConfig.primaryColor }}
          >
            Fonctionnalités
          </span>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
            Tout ce qu&apos;il faut pour{" "}
            <span style={{ color: appConfig.primaryColor }}>exister et agir</span>
          </h2>
          {/* Decorative divider */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <div className="h-px w-16 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
            <div className="h-px w-16 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
          </div>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-gray-500">
            Une suite d&apos;outils pensée pour les associations nigériennes, de la création
            du profil à la mobilisation citoyenne.
          </p>
        </div>

        {/* Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-xl"
              >
                {/* Top accent bar */}
                <div
                  className="absolute left-0 top-0 h-1 w-0 rounded-tr-full transition-all duration-300 group-hover:w-full"
                  style={{ backgroundColor: feature.accent }}
                />

                {/* Icon */}
                <div
                  className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${feature.accent}15` }}
                >
                  <Icon className="h-6 w-6 transition-colors duration-300" style={{ color: feature.accent }} aria-hidden="true" />
                </div>

                {/* Number */}
                <span
                  className="absolute right-5 top-5 text-5xl font-black opacity-5 transition-opacity duration-300 group-hover:opacity-10"
                  style={{ color: feature.accent }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <h3 className="mb-2 text-base font-bold text-gray-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{feature.description}</p>

                {/* Bottom accent dot */}
                <div
                  className="mt-5 h-1 w-8 rounded-full transition-all duration-300 group-hover:w-14"
                  style={{ backgroundColor: `${feature.accent}40` }}
                />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
