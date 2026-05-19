"use client";

import { AuthenticatedImagePreview } from "@/components/uploads/AuthenticatedImagePreview";
import { AuthenticatedPdfPreview } from "@/components/uploads/AuthenticatedPdfPreview";

export type AuthenticatedDocumentPreviewProps = {
  src: string;
  /** Titre accessibilité + iframe PDF */
  title: string;
  fileName: string;
  mimeType: string | null;
  /** Classes du conteneur de prévisualisation (PDF / image) */
  className?: string;
};

function isPdf(mimeType: string | null, fileName: string): boolean {
  if (mimeType?.toLowerCase().includes("pdf")) return true;
  return fileName.toLowerCase().endsWith(".pdf");
}

function isImage(mimeType: string | null, fileName: string): boolean {
  if (mimeType?.toLowerCase().startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp)$/i.test(fileName);
}

/**
 * Aperçu document association : PDF via {@link AuthenticatedPdfPreview} (même logique que la fiche association
 * en attente de modération), images via fetch authentifié + blob.
 */
export function AuthenticatedDocumentPreview({
  src,
  title,
  fileName,
  mimeType,
  className,
}: AuthenticatedDocumentPreviewProps) {
  if (isPdf(mimeType, fileName)) {
    return <AuthenticatedPdfPreview src={src} title={title} className={className} />;
  }
  if (isImage(mimeType, fileName)) {
    return <AuthenticatedImagePreview src={src} title={title} className={className} />;
  }

  return (
    <div
      className={
        className ??
        "flex min-h-[min(40vh,320px)] w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center"
      }
    >
      <p className="max-w-md text-sm text-muted-foreground">
        Aperçu intégré non disponible pour ce type de fichier. Ouvrez-le dans un nouvel onglet pour le consulter.
      </p>
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Ouvrir dans un nouvel onglet
      </a>
    </div>
  );
}
