"use client";

import type { ReactNode } from "react";
import type { RegionTableRow } from "@/actions/settings/geo";
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import appConfig from "@/settings";

export interface ViewRegionProps {
  region: RegionTableRow;
  /** Injecté par `View` via `cloneElement` si absent */
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

export default function ViewRegion({ region, onClose }: ViewRegionProps) {
  const close = onClose ?? (() => undefined);

  return (
    <>
      <DialogHeader>
        <DialogTitle style={{ color: appConfig.primaryColor }}>
          Détails de la région
        </DialogTitle>
        <DialogDescription>
          Informations en lecture seule issues du référentiel géographique.
        </DialogDescription>
      </DialogHeader>

      <dl className="py-2">
        <Row label="Identifiant" value={<span className="font-mono text-xs">{region.id}</span>} />
        <Row label="Code" value={<span className="font-mono">{region.code}</span>} />
        <Row label="Libellé" value={region.name} />
        <Row label="Départements" value={region._count.departements} />
        <Row label="Communes" value={region._count.communes} />
      </dl>

      <DialogFooter>
        <Button type="button" variant="secondary" onClick={close}>
          Fermer
        </Button>
      </DialogFooter>
    </>
  );
}
