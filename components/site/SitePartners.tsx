import Image from "next/image";
import appConfig from "@/settings";

const partners = [
  {
    name: "Ministère de la Jeunesse, des Sports et de la Culture",
    abbr: "MJSC",
    role: "Ministère tutelle",
    logo: "/partenaires/niger.png",
    url: "#",
  },
  {
    name: "Programme des Nations Unies pour le Développement",
    abbr: "PNUD",
    role: "Partenaire au développement",
    logo: "/partenaires/undp.png",
    url: "https://www.undp.org/fr/niger",
  },
];

const track = [...partners, ...partners, ...partners, ...partners];

export function SitePartners() {
  return (
    <section className="w-full overflow-hidden bg-gray-50 py-20 md:py-24">

      {/* Header */}
      <div className="mx-auto mb-12 max-w-7xl px-4 text-center md:px-8">
        <span
          className="mb-3 inline-block text-xs font-bold uppercase tracking-widest"
          style={{ color: appConfig.primaryColor }}
        >
          Partenaires
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Nos partenaires{" "}
          <span style={{ color: appConfig.secondaryColor }}>institutionnels</span>
        </h2>
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="h-px w-12 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
          <div className="h-px w-12 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
        </div>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-500">
          Institutions et organisations qui soutiennent l&apos;écosystème associatif du Niger.
        </p>
      </div>

      {/* Slider */}
      <div className="relative">
        <div className="logo-slide-track">
          {track.map((partner, i) => (
            <a
              key={i}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group mx-4 flex w-64 shrink-0 flex-col items-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
            >
              {/* Logo container */}
              <div
                className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-100 bg-gray-50 p-2 transition-all duration-300 group-hover:scale-105"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Badge */}
              <span className="mb-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gray-600">
                {partner.abbr}
              </span>

              {/* Name */}
              <p className="text-center text-xs font-semibold leading-snug text-gray-700">
                {partner.name}
              </p>

              {/* Role */}
              <p className="mt-1 text-center text-[11px] text-gray-400">{partner.role}</p>

              {/* Bottom accent */}
              <div
                className="mt-4 h-0.5 w-0 rounded-full transition-all duration-300 group-hover:w-12"
                style={{ backgroundColor: appConfig.primaryColor }}
              />
            </a>
          ))}
        </div>

        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-gray-50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-gray-50 to-transparent" />
      </div>
    </section>
  );
}
