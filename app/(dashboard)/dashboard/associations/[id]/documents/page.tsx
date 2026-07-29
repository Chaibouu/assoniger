import { assertAssociationManagementAccess } from "@/lib/association-self-access";
import { db } from "@/lib/db";
import appConfig from "@/settings";
import { addAssociationDocumentAction } from "@/actions/associations/association-self-service";
import { AssociationDocumentAddDialog } from "@/components/dashboard/AssociationDocumentAddDialog";
import { AssociationDocumentRowActions } from "@/components/dashboard/AssociationDocumentRowActions";
import { associationDocumentTypeLabels } from "@/lib/association-document-types";
import { AssociationAdminShell } from "@/components/dashboard/AssociationAdminShell";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ok?: string; err?: string }>;
};

const errMessages: Record<string, string> = {
  type: "Type de document invalide.",
  fichier: "Veuillez sélectionner un fichier (PDF ou image, max 10 Mo).",
  upload: "Échec de l'envoi du fichier. Vérifiez le format et la taille.",
  docnf: "Document introuvable ou déjà supprimé.",
};

export default async function AdminAssociationDocumentsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = (await searchParams) ?? {};

  await assertAssociationManagementAccess(id);

  const documents = await db.associationDocument.findMany({
    where: { associationId: id, isDeleted: false },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, documentType: true, fileName: true, fileUrl: true,
      fileSize: true, mimeType: true, isVerified: true, createdAt: true,
    },
  });

  return (
    <AssociationAdminShell associationId={id} active="documents">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Documents</h2>
          <p className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? "s" : ""} — PDF ou images (max 10 Mo).
          </p>
        </div>

        {sp.ok === "1" && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-100" role="status">
            Document ajouté.
          </div>
        )}
        {sp.ok === "2" && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-950 dark:text-emerald-100" role="status">
            Document supprimé.
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
              <h3 className="text-lg font-semibold text-foreground">Documents enregistrés</h3>
              <AssociationDocumentAddDialog associationId={id} addAction={addAssociationDocumentAction} />
            </div>
            {documents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                Aucun document pour l'instant.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Type</TableHead>
                    <TableHead>Nom du fichier</TableHead>
                    <TableHead className="hidden w-[140px] sm:table-cell">Ajouté le</TableHead>
                    <TableHead className="w-[120px] text-center">Statut</TableHead>
                    <TableHead className="min-w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Badge variant="secondary" className="max-w-[150px] truncate text-[0.65rem] font-semibold">
                          {associationDocumentTypeLabels[d.documentType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        <div className="max-w-[min(100vw-8rem,28rem)] truncate sm:max-w-md" title={d.fileName}>{d.fileName}</div>
                        <div className="mt-1 text-xs font-normal text-muted-foreground sm:hidden">
                          {new Date(d.createdAt).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {new Date(d.createdAt).toLocaleDateString("fr-FR", { dateStyle: "medium" })}
                      </TableCell>
                      <TableCell className="text-center text-xs">
                        {d.isVerified ? (
                          <span className="text-emerald-700 dark:text-emerald-400">Vérifié</span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-300">En attente</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AssociationDocumentRowActions
                          associationId={id}
                          doc={{
                            id: d.id, documentType: d.documentType, fileName: d.fileName,
                            fileUrl: d.fileUrl, fileSize: d.fileSize, mimeType: d.mimeType,
                            isVerified: d.isVerified, createdAt: d.createdAt.toISOString(),
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </section>
      </div>
    </AssociationAdminShell>
  );
}
