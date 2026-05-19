import Link from "next/link";
import { assertAssociationManagementAccess } from "@/lib/association-self-access";
import { loadAssociationWorkspacePageContext } from "@/lib/association-workspace-page";
import { db } from "@/lib/db";
import appConfig from "@/settings";
import {
  approveJoinRequestAction,
  rejectJoinRequestAction,
} from "@/actions/associations/association-self-service";
import { ArrowLeft } from "lucide-react";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ok?: string; err?: string }>;
};

const errMessages: Record<string, string> = {
  notfound: "Demande introuvable ou déjà traitée.",
  invalid: "Requête invalide.",
};

export default async function AdhesionAssociationPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  await assertAssociationManagementAccess(id);
  const { association, back } = await loadAssociationWorkspacePageContext(id);

  const requests = await db.associationMember.findMany({
    where: {
      associationId: id,
      isDeleted: false,
      position: "MEMBER_PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Demandes d’adhésion
          </h1>
          <p className="text-sm text-muted-foreground">{association.name}</p>
        </div>
      </div>

      {sp.ok === "1" ? (
        <div
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-100"
          role="status"
        >
          Mise à jour enregistrée.
        </div>
      ) : null}
      {sp.err && errMessages[sp.err] ? (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {errMessages[sp.err]}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
        <div className="h-1 w-full shrink-0" style={{ backgroundColor: appConfig.primaryColor }} aria-hidden />
        <div className="p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Demandes en attente ({requests.length})</h2>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-4 py-4 first:pt-0 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{r.fullName}</p>
                    {r.email ? (
                      <p className="text-sm text-muted-foreground break-all">{r.email}</p>
                    ) : null}
                    {r.phone ? <p className="text-sm text-muted-foreground">{r.phone}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={approveJoinRequestAction}>
                      <input type="hidden" name="associationId" value={id} />
                      <input type="hidden" name="memberId" value={r.id} />
                      <button
                        type="submit"
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
                        style={{ backgroundColor: appConfig.primaryColor }}
                      >
                        Accepter
                      </button>
                    </form>
                    <form action={rejectJoinRequestAction}>
                      <input type="hidden" name="associationId" value={id} />
                      <input type="hidden" name="memberId" value={r.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
                      >
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
  );
}
