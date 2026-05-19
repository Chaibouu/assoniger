"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  /** Chemin ou URL du PDF (ex. `/uploads/associations/.../doc.pdf`) */
  src: string;
  title: string;
  className?: string;
};

const viewerShell =
  "flex min-h-[min(70vh,560px)] h-[min(70vh,560px)] w-full flex-col rounded-lg border border-border bg-muted/40 overflow-hidden";

/**
 * Prévisualisation PDF : fetch authentifié + iframe sur URL blob.
 * Évite @react-pdf-viewer / pdf.js (erreurs `destroy` au démontage, Strict Mode).
 * La barre d’outils est celle du lecteur PDF natif du navigateur (`#toolbar=1`).
 */
export function AuthenticatedPdfPreview({ src, title, className }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeBlobRef = useRef<string | null>(null);

  useEffect(() => {
    let aborted = false;
    activeBlobRef.current = null;
    setBlobUrl(null);

    async function load() {
      setError(null);
      try {
        const res = await fetch(src, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          if (!aborted) {
            setError(
              res.status === 401
                ? "Session expirée ou accès refusé. Rechargez la page ou reconnectez-vous."
                : `Impossible de charger le document (erreur ${res.status}).`
            );
          }
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (aborted) {
          URL.revokeObjectURL(url);
          return;
        }
        activeBlobRef.current = url;
        setBlobUrl(url);
      } catch {
        if (!aborted) {
          setError(
            "Impossible de charger le PDF (réseau indisponible ou navigateur hors ligne)."
          );
        }
      }
    }

    void load();

    return () => {
      aborted = true;
      const previous = activeBlobRef.current;
      activeBlobRef.current = null;
      setBlobUrl(null);
      if (previous) {
        window.setTimeout(() => URL.revokeObjectURL(previous), 1200);
      }
    };
  }, [src]);

  const shellClass = className ?? viewerShell;

  if (error) {
    return (
      <div
        className={`flex ${shellClass} flex-col items-center justify-center border-destructive/30 bg-destructive/5 px-4 text-center`}
        role="alert"
      >
        <p className="max-w-md text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className={shellClass} role="region" aria-label={title}>
      {blobUrl ? (
        <iframe
          title={title}
          src={`${blobUrl}#toolbar=1`}
          className="min-h-0 flex-1 w-full border-0 bg-muted/20"
        />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-muted/40">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Chargement du document…</p>
        </div>
      )}
    </div>
  );
}
