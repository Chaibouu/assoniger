"use client";

import type { ReactNode } from "react";
import type { DepartementTableRow } from "@/actions/settings/geo";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import appConfig from "@/settings";

export interface ViewDepartementProps {
  departement: DepartementTableRow;
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

export default function ViewDepartement({ departement, onClose }: ViewDepartementProps) {
  const close = onClose ?? (() => undefined);

  return (
    <>
      <DialogHeader>
        <DialogTitle style={{ color: appConfig.primaryColor }}>
          Détails du département
        </DialogTitle>
        <DialogDescription>
          Informations en lecture seule issues du référentiel géographique.
        </DialogDescription>
      </DialogHeader>

      <dl className="py-2">
        <Row label="Identifiant" value={<span className="font-mono text-xs">{departement.id}</span>} />
        <Row
          label="Région"
          value={
            <>
              {departement.region.name}{" "}
              <span className="font-mono text-muted-foreground">({departement.region.code})</span>
            </>
          }
        />
        <Row
          label="Code département"
          value={
            departement.code ? (
              <span className="font-mono">{departement.code}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )
          }
        />
        <Row label="Libellé" value={departement.name} />
        <Row label="Communes" value={departement._count.communes} />
        <Row label="Associations" value={departement._count.associations} />
      </dl>

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={close}>
          Fermer
        </Button>
      </DialogFooter>
    </>
  );
}
