"use client";

import type { ReactNode } from "react";
import type { CommuneTableRow } from "@/actions/settings/geo";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import appConfig from "@/settings";

export interface ViewCommuneProps {
  commune: CommuneTableRow;
  onClose?: () => void;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-b border-border py-3 last:border-0 sm:grid-cols-[140px_1fr]">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function ViewCommune({ commune, onClose }: ViewCommuneProps) {
  const close = onClose ?? (() => undefined);

  return (
    <>
      <DialogHeader>
        <DialogTitle style={{ color: appConfig.primaryColor }}>Détails de la commune</DialogTitle>
        <DialogDescription>
          Informations en lecture seule issues du référentiel géographique.
        </DialogDescription>
      </DialogHeader>

      <dl className="py-2">
        <Row label="Identifiant" value={<span className="font-mono text-xs">{commune.id}</span>} />
        <Row
          label="Région"
          value={
            <>
              {commune.departement.region.name}{" "}
              <span className="font-mono text-muted-foreground">
                ({commune.departement.region.code})
              </span>
            </>
          }
        />
        <Row label="Département" value={commune.departement.name} />
        <Row
          label="Code commune"
          value={
            commune.code ? (
              <span className="font-mono">{commune.code}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )
          }
        />
        <Row label="Libellé" value={commune.name} />
        <Row label="Associations" value={commune._count.associations} />
      </dl>

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={close}>
          Fermer
        </Button>
      </DialogFooter>
    </>
  );
}
