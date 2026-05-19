"use client";

import * as React from "react";
import appConfig from "@/settings";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import { listAssociationDocumentTypesForForm } from "@/lib/association-document-types";

type AssociationDocumentAddFormProps = {
  associationId: string;
  addAction: (formData: FormData) => Promise<void>;
};

const docTypes = listAssociationDocumentTypesForForm();

export function AssociationDocumentAddForm({ associationId, addAction }: AssociationDocumentAddFormProps) {
  return (
    <form action={addAction} className="grid w-full gap-4" encType="multipart/form-data">
      <input type="hidden" name="associationId" value={associationId} />
      <p className="text-sm text-muted-foreground">
        Formats acceptés : PDF, JPEG, PNG, WebP, GIF. Taille maximale 10 Mo.
      </p>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="documentType">
          Type de document
        </label>
        <select
          id="documentType"
          name="documentType"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {docTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="file">
          Fichier
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/*"
          className="flex w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
        />
      </div>
      <FormSubmitButton
        pendingLabel="Envoi en cours…"
        className="w-fit rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-70"
        style={{ backgroundColor: appConfig.primaryColor }}
      >
        Enregistrer le document
      </FormSubmitButton>
    </form>
  );
}
