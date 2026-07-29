import { assertAssociationManagementAccess } from "@/lib/association-self-access";
import { db } from "@/lib/db";
import appConfig from "@/settings";
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
} from "@/actions/associations/association-self-service";
import { AssociationAdminShell } from "@/components/dashboard/AssociationAdminShell";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ok?: string; err?: string }>;
};

const errMessages: Record<string, string> = {
  notfound: "Demande introuvable ou déjà traitée.",
  invalid: "Requête invalide.",
};

export default async function AdminAssociationAdhesionPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  await assertAssociationManagementAccess(id);

  const requests = await db.associationMember.findMany({
    where: { associationId: id, isDeleted: false, position: "MEMBER_PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AssociationAdminShell associationId={id} active="demandes">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Demandes d'adhésion</h2>
          <p className="text-sm text-muted-foreground">
            {requests.length} demande{requests.length !== 1 ? "s" : ""} en attente de traitement.
          </p>
        </div>

        {sp.ok === "1" && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-100" role="status">
            Mise à jour enregistrée.
          </div>
        )}
        {sp.err && errMessages[sp.err] && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {errMessages[sp.err]}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
          <div className="h-1 w-full shrink-0" style={{ backgroundColor: appConfig.primaryColor }} aria-hidden />
          <div className="p-5 sm:p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Demandes en attente ({requests.length})
            </h3>
            {requests.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune demande pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-border/60">
                {requests.map((r) => (
                  <li key={r.id} className="flex flex-col gap-4 py-4 first:pt-0 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-medium text-foreground">{r.fullName}</p>
                      {r.email && <p className="text-sm text-muted-foreground break-all">{r.email}</p>}
                      {r.phone && <p className="text-sm text-muted-foreground">{r.phone}</p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={approveJoinRequestAction}>
                        <input type="hidden" name="associationId" value={id} />
                        <input type="hidden" name="memberId" value={r.id} />
                        <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90" style={{ backgroundColor: appConfig.primaryColor }}>
                          Accepter
                        </button>
                      </form>
                      <form action={rejectJoinRequestAction}>
                        <input type="hidden" name="associationId" value={id} />
                        <input type="hidden" name="memberId" value={r.id} />
                        <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80">
                          Refuser
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </AssociationAdminShell>
  );
}
