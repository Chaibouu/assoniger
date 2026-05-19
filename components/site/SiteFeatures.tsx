const features = [
  {
    title: "Annuaire associatif",
    description: "Mettez en avant les associations et leurs informations essentielles.",
  },
  {
    title: "Besoins et actions",
    description: "Publiez des besoins en dons, bénévolat, services ou matériel.",
  },
  {
    title: "Transparence",
    description: "Centralisez les documents légaux et le suivi des validations.",
  },
];

export function SiteFeatures() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16">
      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <article key={feature.title} className="rounded-xl border p-5">
            <h2 className="text-lg font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
