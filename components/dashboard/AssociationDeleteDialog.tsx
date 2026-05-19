"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type AssociationDeleteDialogProps = {
  associationId: string;
  associationName: string;
  deleteAction: (formData: FormData) => Promise<void>;
};

/** Confirmation de suppression (soft delete) depuis la liste des associations. */
export function AssociationDeleteDialog({
  associationId,
  associationName,
  deleteAction,
}: AssociationDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await deleteAction(formData);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="Supprimer"
          aria-label="Supprimer"
          className="inline-flex items-center justify-center rounded-md border border-red-300 bg-transparent p-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[435px]">
        <DialogHeader>
          <DialogTitle>Supprimer l&apos;association</DialogTitle>
          <DialogDescription className="pt-2 leading-relaxed">
            Veuillez confirmer la suppression de{" "}
            <span className="font-semibold text-foreground">{associationName}</span>. L&apos;association
            sera marquée comme supprimée et ne sera plus visible dans les listes publiques.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="associationId" value={associationId} />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
