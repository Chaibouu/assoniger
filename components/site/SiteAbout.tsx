import { Eye, Network, Scale } from "lucide-react";
import appConfig from "@/settings";

const pillars = [
  {
    icon: Eye,
    title: "Visibilité",
    description:
      "Donnez une vitrine publique à votre association. Atteignez citoyens, partenaires et institutions à travers tout le Niger.",
  },
  {
    icon: Network,
    title: "Mobilisation",
    description:
      "Publiez vos besoins en bénévolat, dons ou services. Connectez-vous avec ceux qui souhaitent s'engager.",
  },
  {
    icon: Scale,
    title: "Transparence",
    description:
      "Centralisez vos documents légaux, suivez vos validations et renforcez la confiance du public.",
  },
];

export function SiteAbout() {
  return (
    <section id="apropos" className="w-full bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 md:py-28">

        <div className="grid gap-16 md:grid-cols-2 md:gap-24 md:items-center">

          {/* Left — text */}
          <div>
            <p
              className="mb-4 text-xs font-bold uppercase tracking-widest"
              style={{ color: appConfig.primaryColor }}
            >
              À propos
            </p>
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
              Une plateforme au service des associations nigériennes
            </h2>
            <p className="mt-5 text-base leading-relaxed text-gray-600">
              AssoNiger est le registre officiel des associations du Niger. Notre mission est
              d'améliorer la visibilité, la confiance et la mobilisation autour des initiatives
              locales à travers tout le pays.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Que vous soyez citoyen, partenaire institutionnel ou responsable d'association,
              cette plateforme est conçue pour vous faciliter la vie.
            </p>

            {/* Stat inline */}
            <div className="mt-8 flex items-center gap-4">
              <div
                className="h-12 w-1 rounded-full"
                style={{ backgroundColor: appConfig.primaryColor }}
                aria-hidden="true"
              />
              <p className="text-sm text-gray-500">
                Plateforme développée en partenariat avec le{" "}
                <span className="font-semibold text-gray-700">Ministère de la Jeunesse, des Sports et de la Culture</span>{" "}
                du Niger
              </p>
            </div>
          </div>

          {/* Right — pillars */}
          <div className="flex flex-col gap-4">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article
                  key={pillar.title}
                  className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-6 transition-shadow duration-200 hover:shadow-md"
                >
                  <div
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${appConfig.primaryColor}12` }}
                  >
                    <Icon
                      className="h-5 w-5"
                      style={{ color: appConfig.primaryColor }}
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{pillar.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                      {pillar.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
