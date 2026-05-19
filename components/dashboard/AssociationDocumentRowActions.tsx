"use client";

import * as React from "react";
import type { DocumentType } from "@prisma/client";
import { Download, Eye, Trash2 } from "lucide-react";
import { removeAssociationDocumentAction } from "@/actions/associations/association-self-service";
import { associationDocumentTypeLabels } from "@/lib/association-document-types";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthenticatedDocumentPreview } from "@/components/uploads/AuthenticatedDocumentPreview";

export type AssociationDocumentRowData = {
  id: string;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  isVerified: boolean;
  createdAt: string;
};

type AssociationDocumentRowActionsProps = {
  associationId: string;
  doc: AssociationDocumentRowData;
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function fmtBytes(n: number | null): string {
  if (n == null || n < 0) return "—";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
}

export function AssociationDocumentRowActions({ associationId, doc }: AssociationDocumentRowActionsProps) {
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const typeLabel = associationDocumentTypeLabels[doc.documentType];

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="Voir le document"
          aria-label="Voir le document dans une fenêtre"
          onClick={() => setDetailOpen(true)}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" asChild title="Ouvrir / télécharger">
          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" aria-label="Ouvrir ou télécharger le fichier">
            <Download className="h-4 w-4" />
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
          title="Supprimer"
          aria-label="Supprimer le document"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="flex max-h-[92vh] max-w-[min(96vw,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
          <div className="border-b border-border px-6 pb-4 pt-6">
            <DialogHeader>
              <DialogTitle className="pr-8">Aperçu du document</DialogTitle>
              <DialogDescription className="line-clamp-3 break-all">{doc.fileName}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Prévisualisation
            </p>
            {detailOpen ? (
              <AuthenticatedDocumentPreview
                key={doc.id}
                src={doc.fileUrl}
                title={`Aperçu — ${doc.fileName}`}
                fileName={doc.fileName}
                mimeType={doc.mimeType}
                className="flex min-h-[min(65vh,480px)] h-[min(65vh,480px)] w-full flex-col rounded-lg border border-border bg-muted/40 overflow-hidden"
              />
            ) : null}
            <dl className="mt-4 grid gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Type</dt>
                <dd className="mt-0.5 text-foreground">{typeLabel}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vérification
                </dt>
                <dd className="mt-0.5 text-foreground">
                  {doc.isVerified ? (
                    <span className="text-emerald-700 dark:text-emerald-400">Vérifié</span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-300">En attente</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">Taille</dt>
                <dd className="mt-0.5 text-foreground">{fmtBytes(doc.fileSize)}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ajouté le
                </dt>
                <dd className="mt-0.5 text-foreground">{fmtDate(doc.createdAt)}</dd>
              </div>
              {doc.mimeType ? (
                <div className="sm:col-span-2">
                  <dt className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Type MIME
                  </dt>
                  <dd className="mt-0.5 break-all text-foreground">{doc.mimeType}</dd>
                </div>
              ) : null}
            </dl>
          </div>
          <DialogFooter className="border-t border-border px-6 py-4 sm:justify-between">
            <Button type="button" variant="outline" asChild>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                Ouvrir dans un nouvel onglet
              </a>
            </Button>
            <Button type="button" variant="secondary" onClick={() => setDetailOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer ce document ?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{doc.fileName}</span> sera retiré de la liste. Le
              fichier pourra être supprimé du serveur.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
            <form action={removeAssociationDocumentAction} className="inline-flex">
              <input type="hidden" name="associationId" value={associationId} />
              <input type="hidden" name="documentId" value={doc.id} />
              <FormSubmitButton variant="destructive" pendingLabel="Suppression…">
                Supprimer
              </FormSubmitButton>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
