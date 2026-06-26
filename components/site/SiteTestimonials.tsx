import appConfig from "@/settings";

const testimonials = [
  {
    quote:
      "La plateforme nous a permis d'être plus visibles et de mieux présenter nos besoins auprès des partenaires institutionnels.",
    name: "Amina M.",
    role: "Responsable d'association",
    initials: "AM",
  },
  {
    quote:
      "J'ai trouvé facilement des initiatives locales près de chez moi et j'ai pu m'engager rapidement grâce à l'annuaire.",
    name: "Ibrahim S.",
    role: "Citoyen bénévole",
    initials: "IS",
  },
  {
    quote:
      "Un outil précieux pour suivre les associations actives et renforcer la transparence du tissu associatif.",
    name: "Fatou R.",
    role: "Partenaire institutionnel",
    initials: "FR",
  },
];

export function SiteTestimonials() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 md:px-8 md:py-28">

        {/* Header */}
        <div className="mb-14 text-center">
          <p
            className="mb-4 text-xs font-bold uppercase tracking-widest"
            style={{ color: appConfig.primaryColor }}
          >
            Témoignages
          </p>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
            Ce qu&apos;en disent nos utilisateurs
          </h2>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <article
              key={item.name}
              className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 p-7"
            >
              {/* Quote mark */}
              <div
                className="mb-5 text-5xl font-serif leading-none"
                style={{ color: appConfig.primaryColor }}
                aria-hidden="true"
              >
                &ldquo;
              </div>

              <blockquote className="flex-1 text-base leading-relaxed text-gray-700">
                {item.quote}
              </blockquote>

              <footer className="mt-7 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: appConfig.primaryColor }}
                  aria-hidden="true"
                >
                  {item.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.role}</p>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
