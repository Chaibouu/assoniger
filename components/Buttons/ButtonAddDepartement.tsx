"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import type { RegionOption } from "@/actions/settings/geo";
import AddDepartement from "@/components/forms/settings/addDepartement";
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

export interface ButtonAddDepartementProps {
  regions: RegionOption[];
}

export default function ButtonAddDepartement({ regions }: ButtonAddDepartementProps) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          disabled={regions.length === 0}
          title={regions.length === 0 ? "Créez d’abord une région" : undefined}
          className="flex items-center gap-2 border-0 text-white shadow-sm hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: appConfig.primaryColor }}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Ajouter un département
        </Button>
      </DialogTrigger>
      <DialogContent className="overflow-visible sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: appConfig.primaryColor }}>Nouveau département</DialogTitle>
          <DialogDescription>
            Choisissez la région parente, le libellé et éventuellement un code administratif. Le nom doit être unique au sein de la région.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <AddDepartement regions={regions} onClose={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
