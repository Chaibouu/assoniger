import { assertAssociationManagementAccess } from "@/lib/association-self-access";
import { db } from "@/lib/db";
import appConfig from "@/settings";
import { AssociationMemberAddDialog } from "@/components/dashboard/AssociationMemberAddDialog";
import { AssociationMemberRowActions } from "@/components/dashboard/AssociationMemberRowActions";
import { addAssociationMemberAction } from "@/actions/associations/association-self-service";
import {
  ASSOCIATION_MEMBER_SIMPLE_POSITION,
  isExecutiveBoardMemberPosition,
} from "@/lib/association-member-kind";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AssociationAdminShell } from "@/components/dashboard/AssociationAdminShell";

const errMessages: Record<string, string> = {
  champs: "Le nom complet doit contenir au moins 2 caractères.",
  poste: "Pour un membre du bureau exécutif, la fonction / le poste doit contenir au moins 2 caractères.",
  email: "Adresse e-mail invalide.",
  notfound: "Entrée introuvable.",
  pending: "Cette ligne est une demande d'adhésion : gérez-la depuis l'onglet « Demandes d'adhésion ».",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ok?: string; err?: string }>;
};

export default async function AdminAssociationMembresPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  await assertAssociationManagementAccess(id);

  const members = await db.associationMember.findMany({
    where: {
      associationId: id,
      isDeleted: false,
      NOT: { position: "MEMBER_PENDING" },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      fullName: true,
      position: true,
      phone: true,
      email: true,
      photoUrl: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const executiveMembers = members.filter((m) => isExecutiveBoardMemberPosition(m.position));
  const simpleMembers = members.filter((m) => m.position === ASSOCIATION_MEMBER_SIMPLE_POSITION);
  const tableRows = [...executiveMembers, ...simpleMembers];

  return (
    <AssociationAdminShell associationId={id} active="membres">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Membres & bureau</h2>
          <p className="text-sm text-muted-foreground">
            {tableRows.length} membre{tableRows.length !== 1 ? "s" : ""} — {executiveMembers.length} au bureau
            exécutif, {simpleMembers.length} adhérent{simpleMembers.length !== 1 ? "s" : ""}.
          </p>
        </div>

        {sp.ok === "1" && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-100" role="status">
            Enregistrement effectué.
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
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="text-lg font-semibold text-foreground">Liste des membres</h3>
              <AssociationMemberAddDialog associationId={id} addAction={addAssociationMemberAction} />
            </div>

            {tableRows.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                Aucun membre pour l'instant. Utilisez le bouton « Ajouter un membre » pour commencer.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Type</TableHead>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Fonction / rôle</TableHead>
                    <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                    <TableHead className="hidden lg:table-cell">E-mail</TableHead>
                    <TableHead className="w-[100px] text-center">Principal</TableHead>
                    <TableHead className="min-w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((m) => {
                    const isExec = isExecutiveBoardMemberPosition(m.position);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          {isExec ? (
                            <Badge variant="secondary" className="text-[0.65rem] font-semibold uppercase">Bureau</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[0.65rem] font-semibold uppercase">Adhérent</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">
                          <div>{m.fullName}</div>
                          <div className="mt-1 text-xs font-normal text-muted-foreground md:hidden">
                            {[m.phone, m.email].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {isExec ? m.position : <span className="italic">—</span>}
                        </TableCell>
                        <TableCell className="hidden max-w-[140px] truncate text-muted-foreground md:table-cell">
                          {m.phone ?? "—"}
                        </TableCell>
                        <TableCell className="hidden max-w-[180px] truncate text-muted-foreground lg:table-cell">
                          {m.email ?? "—"}
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {isExec && m.isPrimary ? (
                            <span className="text-emerald-700 dark:text-emerald-400">Oui</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <AssociationMemberRowActions
                            associationId={id}
                            member={{
                              id: m.id,
                              fullName: m.fullName,
                              position: m.position,
                              phone: m.phone,
                              email: m.email,
                              photoUrl: m.photoUrl,
                              isPrimary: m.isPrimary,
                              createdAt: m.createdAt.toISOString(),
                              updatedAt: m.updatedAt.toISOString(),
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </section>
      </div>
    </AssociationAdminShell>
  );
}
