"use client";

import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

interface deleteProps {
  id: string;
  /** Libellé affiché si `dialogTitle` est absent : « Supprimer {title} » */
  title?: string;
  /** Clé TanStack Query pour `invalidateQueries` (prioritaire sur `title`) */
  invalidateQueryKey?: string;
  /** Titre complet du modal (ex. « Supprimer la région ») */
  dialogTitle?: string;
  deleteFnct: (id: string) => Promise<{ message?: string; error?: string } | Record<string, unknown>>;
}

const Delete = ({ id, title, invalidateQueryKey, dialogTitle, deleteFnct }: deleteProps) => {
  const [open, setOpen] = React.useState(false);
  const [load, setLoad] = React.useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteFnct,
    onSuccess: (data) => {
      setLoad(false);
      const payload = data as { message?: string; error?: string };
      if (payload.message) {
        queryClient.invalidateQueries({
          queryKey: [invalidateQueryKey ?? title ?? ""],
        });
        toast(payload.message, {
          position: "top-right",
          style: {
            backgroundColor: "#0eda0e",
            color: "white",
          },
        });
        setOpen(false);
      } else if (payload.error) {
        toast(`Erreur : ${payload.error}`, {
          position: "top-right",
          style: {
            backgroundColor: "red",
            color: "white",
          },
        });
      }
    },
    onError: (error: Error) => {
      setLoad(false);

      toast(`Erreur : ${error.message}`, {
        position: "top-right",
        style: {
          backgroundColor: "red",
          color: "white",
        },
      });
    },
  });

  const handleDelete = () => {
    setLoad(true);
    mutation.mutate(id);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Trash2 className="cursor-pointer text-red-600" aria-label="Supprimer" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[435px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle ?? `Supprimer ${title ?? "l'élément"}`}</DialogTitle>
          <DialogDescription className="my-4">
            Veuillez confirmer la suppression.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" disabled={load} onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="button" variant="destructive" disabled={load} onClick={handleDelete}>
            {load ? "…" : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Delete;
