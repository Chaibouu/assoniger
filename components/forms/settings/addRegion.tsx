"use client";

import type { CSSProperties } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createRegion } from "@/actions/settings/geo";
import type { CreateRegionState } from "@/actions/settings/geo";
import { AddRegionSchema, type AddRegionValues } from "@/schemas/regions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import appConfig from "@/settings";

export type { AddRegionValues };

export interface AddRegionProps {
  /** Appelé après succès ou pour fermer (ex. bouton Annuler) */
  onClose: () => void;
}

async function createRegionRequest(values: AddRegionValues): Promise<CreateRegionState> {
  const fd = new FormData();
  fd.append("code", values.code.trim().toUpperCase());
  fd.append("name", values.name.trim());
  return createRegion(fd);
}

/**
 * Formulaire d’ajout de région : react-hook-form + zod + TanStack Query (`useMutation`).
 */
const AddRegion = ({ onClose }: AddRegionProps) => {
  const queryClient = useQueryClient();

  const form = useForm<AddRegionValues>({
    resolver: zodResolver(AddRegionSchema),
    defaultValues: {
      code: "",
      name: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createRegionRequest,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Région créée", {
          position: "top-right",
          style: { backgroundColor: appConfig.primaryColor, color: "white" },
        });
        queryClient.invalidateQueries({ queryKey: ["regions"] });
        form.reset();
        onClose();
      } else {
        toast.error(res.error, {
          position: "top-right",
          style: { backgroundColor: "#f03e3e", color: "white" },
        });
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Erreur réseau";
      toast.error(message, {
        position: "top-right",
        style: { backgroundColor: "#f03e3e", color: "white" },
      });
    },
  });

  const onSubmit = (data: AddRegionValues) => {
    mutation.mutate(data);
  };

  const isPending = mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">
                Code{" "}
                <span className="font-semibold" style={{ color: appConfig.secondaryColor }}>
                  *
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="EXEMPLE"
                  disabled={isPending}
                  autoComplete="off"
                  className="bg-background font-mono uppercase focus-visible:ring-2 focus-visible:ring-[color:var(--brand-ring)] focus-visible:ring-offset-2"
                  style={{ "--brand-ring": appConfig.primaryColor } as CSSProperties}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">
                Libellé{" "}
                <span className="font-semibold" style={{ color: appConfig.secondaryColor }}>
                  *
                </span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Nom de la région"
                  disabled={isPending}
                  autoComplete="off"
                  className="bg-background focus-visible:ring-2 focus-visible:ring-[color:var(--brand-ring)] focus-visible:ring-offset-2"
                  style={{ "--brand-ring": appConfig.primaryColor } as CSSProperties}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            className="border-2 border-red-600 bg-transparent text-red-600 hover:bg-red-50 dark:border-red-500 dark:text-red-400 dark:hover:bg-red-950/50"
            onClick={() => {
              form.reset();
              onClose();
            }}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="min-w-[120px] border-0 text-white shadow-sm hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: appConfig.primaryColor }}
          >
            {isPending ? (
              <svg
                className="mx-auto h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddRegion;
