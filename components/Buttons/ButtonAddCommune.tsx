"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { DepartementOption } from "@/actions/settings/geo";
import AddCommune from "@/components/forms/settings/addCommune";
import { Button } from "@/components/ui/button";
import appConfig from "@/settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface ButtonAddCommuneProps {
  departements: DepartementOption[];
}

export default function ButtonAddCommune({ departements }: ButtonAddCommuneProps) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          disabled={departements.length === 0}
          title={departements.length === 0 ? "Créez d’abord au moins un département" : undefined}
          className="flex items-center gap-2 border-0 text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: appConfig.primaryColor }}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Ajouter une commune
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-visible sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: appConfig.primaryColor }}>Nouvelle commune</DialogTitle>
          <DialogDescription>
            Choisissez le département parent, le libellé et éventuellement un code administratif. Le nom doit être unique au sein du département.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <AddCommune departements={departements} onClose={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
