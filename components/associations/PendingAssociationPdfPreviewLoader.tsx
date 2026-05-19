"use client";

import dynamic from "next/dynamic";

const AuthenticatedPdfPreview = dynamic(
  () =>
    import("@/components/uploads/AuthenticatedPdfPreview").then((m) => ({
      default: m.AuthenticatedPdfPreview,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[min(70vh,560px)] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
        Chargement du lecteur PDF…
      </div>
    ),
  }
);

type Props = {
  src: string;
  title: string;
};

/** Client-only : `next/dynamic` avec `ssr: false` n’est pas autorisé dans les Server Components. */
export function PendingAssociationPdfPreviewLoader({ src, title }: Props) {
  return <AuthenticatedPdfPreview src={src} title={title} />;
}
