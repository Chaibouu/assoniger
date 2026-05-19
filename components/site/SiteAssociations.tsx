import Link from "next/link";

type PublicAssociation = {
  id: string;
  name: string;
  acronym: string | null;
  description: string;
  regionLabel: string;
  logoUrl: string | null;
};

type SiteAssociationsProps = {
  associations: PublicAssociation[];
};

function shortText(value: string, max = 140) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trim()}...`;
}

export function SiteAssociations({ associations }: SiteAssociationsProps) {
  return (
    <section id="associations" className="mx-auto w-full max-w-6xl px-4 pb-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Associations en vedette</h2>
          <p className="text-sm text-muted-foreground">
            Apercu des organisations actives et visibles publiquement.
          </p>
        </div>
      </div>

      {associations.length === 0 ? (
        <div className="rounded-xl border p-6 text-muted-foreground">
          Aucune association publique pour le moment.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {associations.map((association) => (
            <Link
              key={association.id}
              href={`/associations/${association.id}`}
              className="block rounded-xl border p-5 transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                {association.logoUrl ? (
                  <img
                    src={association.logoUrl}
                    alt={association.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold">
                    {association.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold leading-none">{association.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {association.acronym || association.regionLabel}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{shortText(association.description)}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
