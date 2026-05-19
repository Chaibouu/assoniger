import Link from "next/link";
import { notFound } from "next/navigation";
import { AssociationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export default async function AssociationPublicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const association = await db.association.findFirst({
    where: {
      id,
      isDeleted: false,
      status: { in: [AssociationStatus.ACTIVE, AssociationStatus.VERIFIED] },
    },
    include: {
      region: { select: { code: true, name: true } },
      domains: { where: { isDeleted: false }, include: { domain: true } },
      members: { where: { isDeleted: false } },
      needs: {
        where: { status: "OPEN", isDeleted: false },
        take: 6,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!association) {
    notFound();
  }

  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Retour a l'accueil
        </Link>

        <div className="mt-4 rounded-2xl border p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{association.name}</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {association.acronym || association.region?.name || association.region?.code}
              </p>
            </div>
            <div className="rounded-full border px-3 py-1 text-xs">{association.status}</div>
          </div>

          <p className="mt-5 text-muted-foreground">{association.description}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <h2 className="font-semibold">Coordonnees</h2>
              <p className="mt-2 text-sm text-muted-foreground">{association.contactEmail}</p>
              <p className="text-sm text-muted-foreground">{association.contactPhone}</p>
              <p className="text-sm text-muted-foreground">
                {association.address ||
                  `${association.region?.name ?? association.region?.code ?? ""}, ${association.country}`}
              </p>
            </div>
            <div className="rounded-xl border p-4">
              <h2 className="font-semibold">Informations cles</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Statut legal: {association.legalStatus}
              </p>
              <p className="text-sm text-muted-foreground">
                Membres: {association.totalMembers ?? association.members.length}
              </p>
              <p className="text-sm text-muted-foreground">
                Benevoles: {association.totalVolunteers ?? 0}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <h2 className="text-2xl font-semibold">Domaines d'intervention</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {association.domains.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun domaine renseigne.</p>
          ) : (
            association.domains.map((item) => (
              <span key={item.domainId} className="rounded-full border px-3 py-1 text-sm">
                {item.domain.name}
              </span>
            ))
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <h2 className="text-2xl font-semibold">Besoins ouverts</h2>
        {association.needs.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucun besoin publie actuellement.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {association.needs.map((need) => (
              <article key={need.id} className="rounded-xl border p-4">
                <h3 className="font-semibold">{need.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{need.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-auto">
        <SiteFooter />
      </div>
    </main>
  );
}
