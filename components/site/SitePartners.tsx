const partners = [
  "Ministere de l'Interieur",
  "Mairies partenaires",
  "Collectifs citoyens",
  "ONG internationales",
];

export function SitePartners() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16">
      <h2 className="text-2xl font-semibold">Partenaires</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Institutions et organisations qui soutiennent l'ecosysteme associatif.
      </p>
      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {partners.map((partner) => (
          <div key={partner} className="rounded-xl border px-4 py-5 text-center text-sm">
            {partner}
          </div>
        ))}
      </div>
    </section>
  );
}
