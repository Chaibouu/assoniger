const testimonials = [
  {
    name: "Amina M.",
    role: "Responsable d'association",
    quote:
      "La plateforme nous a permis d'etre plus visibles et de mieux presenter nos besoins.",
  },
  {
    name: "Ibrahim S.",
    role: "Citoyen benevole",
    quote:
      "J'ai trouve facilement des initiatives locales et j'ai pu m'engager rapidement.",
  },
  {
    name: "Fatou R.",
    role: "Partenaire institutionnel",
    quote:
      "Un bon outil pour suivre les associations actives et renforcer la transparence.",
  },
];

export function SiteTestimonials() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16">
      <h2 className="text-2xl font-semibold">Temoignages</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {testimonials.map((item) => (
          <article key={item.name} className="rounded-xl border p-5">
            <p className="text-sm text-muted-foreground">"{item.quote}"</p>
            <p className="mt-4 text-sm font-semibold">{item.name}</p>
            <p className="text-xs text-muted-foreground">{item.role}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
