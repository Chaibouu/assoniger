"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AssociationMemberAddForm } from "@/components/dashboard/AssociationMemberAddForm";
import appConfig from "@/settings";

type AssociationMemberAddDialogProps = {
  associationId: string;
  addAction: (formData: FormData) => Promise<void>;
};

export function AssociationMemberAddDialog({ associationId, addAction }: AssociationMemberAddDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [formKey, setFormKey] = React.useState(0);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setFormKey((k) => k + 1);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          className="gap-2 text-white shadow-sm"
          style={{ backgroundColor: appConfig.primaryColor }}
        >
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
          Ajouter un membre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,720px)] max-w-lg gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <div className="border-b border-border px-6 pb-4 pt-6">
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>
              Choisissez si la personne fait partie du <strong>bureau exécutif</strong> (avec un poste précis) ou est un{" "}
              <strong>membre simple</strong> (adhérent sans fonction au bureau).
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="px-6 py-4">
          <AssociationMemberAddForm key={formKey} associationId={associationId} addAction={addAction} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
