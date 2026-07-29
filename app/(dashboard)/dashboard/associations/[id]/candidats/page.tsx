import { assertAssociationManagementAccess } from "@/lib/association-self-access";
import appConfig from "@/settings";
import { AssociationAdminShell } from "@/components/dashboard/AssociationAdminShell";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminAssociationCandidatsPage({ params }: PageProps) {
  const { id } = await params;

  await assertAssociationManagementAccess(id);

  return (
    <AssociationAdminShell associationId={id} active="candidats">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Candidat</h2>
          <p className="text-sm text-muted-foreground">
            Gestion des candidatures et appels à volontaires.
          </p>
        </div>

        <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
          <div className="h-1 w-full shrink-0" style={{ backgroundColor: appConfig.primaryColor }} aria-hidden />
          <div className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-foreground">Candidatures</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Recrutement, volontariat, appels à candidatures : contenu à brancher selon vos besoins.
            </p>
            <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              Aucun candidat enregistré pour l'instant.
            </p>
          </div>
        </section>
      </div>
    </AssociationAdminShell>
  );
}
