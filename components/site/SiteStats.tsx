type SiteStatsProps = {
  totalAssociations: number;
  totalMembers: number;
  totalNeeds: number;
};

export function SiteStats({ totalAssociations, totalMembers, totalNeeds }: SiteStatsProps) {
  const items = [
    { label: "Associations actives", value: totalAssociations },
    { label: "Membres references", value: totalMembers },
    { label: "Besoins publies", value: totalNeeds },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-16">
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.label} className="rounded-xl border p-6 text-center">
            <p className="text-3xl font-bold">{item.value.toLocaleString("fr-FR")}</p>
            <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
