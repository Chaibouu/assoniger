import Link from "next/link";
import { assertAssociationManagementAccess } from "@/lib/association-self-access";
import { loadAssociationWorkspacePageContext } from "@/lib/association-workspace-page";
import appConfig from "@/settings";
import { ArrowLeft } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CandidatAssociationPage({ params }: PageProps) {
  const { id } = await params;

  await assertAssociationManagementAccess(id);
  const { association, back } = await loadAssociationWorkspacePageContext(id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="flex flex-col gap-2">
        <Link
          href={back.href}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {back.label}
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Candidat</h1>
          <p className="text-sm text-muted-foreground">{association.name}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: appConfig.primaryColor }} aria-hidden />
        <div className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-foreground">Candidatures</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Gestion des candidats (recrutement, volontariat, appels à candidatures) : contenu à brancher selon vos
            besoins.
          </p>
          <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            Aucun candidat enregistré pour l’instant.
          </p>
        </div>
      </section>
    </div>
  );
}
