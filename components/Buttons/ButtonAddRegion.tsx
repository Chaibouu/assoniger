"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import AddRegion from "@/components/forms/settings/addRegion";
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

export default function ButtonAddRegion() {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className="flex items-center gap-2 border-0 text-white shadow-sm hover:opacity-90"
          style={{ backgroundColor: appConfig.primaryColor }}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Ajouter une région
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle style={{ color: appConfig.primaryColor }}>Nouvelle région</DialogTitle>
          <DialogDescription>
            Code unique en majuscules (ex.&nbsp;: NIAMEY) et libellé affiché dans les listes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <AddRegion onClose={handleClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
