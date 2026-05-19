"use client";

import type { CSSProperties } from "react";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState, type ControllerRenderProps } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CommuneTableRow, CreateCommuneState, DepartementOption } from "@/actions/settings/geo";
import { updateCommune } from "@/actions/settings/geo";
import { AddCommuneSchema, type AddCommuneValues } from "@/schemas/communes";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Select, { type GroupBase, type SingleValue } from "react-select";
import {
  geoReactSelectClassNames,
  geoReactSelectPortalStyles,
  toDepartementSelectOptions,
  type GeoSelectOption,
} from "@/components/forms/settings/geo-form-select";
import appConfig from "@/settings";

function DepartementSelectInner({
  field,
  departementOptions,
  selectClassNames,
  departementIdError,
  isPending,
  departementsLength,
}: {
  field: ControllerRenderProps<AddCommuneValues, "departementId">["field"];
  departementOptions: GeoSelectOption[];
  selectClassNames: ReturnType<typeof geoReactSelectClassNames>;
  departementIdError: boolean;
  isPending: boolean;
  departementsLength: number;
}) {
  const { formItemId } = useFormField();

  return (
    <div
      className="relative w-full"
      style={{ "--brand-ring": appConfig.primaryColor } as CSSProperties}
    >
      <Select<GeoSelectOption, false, GroupBase<GeoSelectOption>>
        unstyled
        instanceId="edit-commune-departement"
        inputId={formItemId}
        name={field.name}
        ref={field.ref}
        options={departementOptions}
        value={departementOptions.find((o) => o.value === field.value) ?? null}
        onChange={(opt: SingleValue<GeoSelectOption>) => field.onChange(opt?.value ?? "")}
        onBlur={field.onBlur}
        placeholder="Choisir un département"
        isDisabled={isPending || departementsLength === 0}
        isClearable={false}
        isSearchable
        menuPosition="absolute"
        menuPlacement="auto"
        styles={geoReactSelectPortalStyles}
        classNames={selectClassNames}
        aria-invalid={departementIdError}
        noOptionsMessage={() => "Aucun département"}
      />
    </div>
  );
}

export interface EditCommuneProps {
  commune: Pick<CommuneTableRow, "id" | "departementId" | "code" | "name">;
  departements: DepartementOption[];
  onClose?: () => void;
}

async function updateCommuneRequest(
  communeId: string,
  values: AddCommuneValues
): Promise<CreateCommuneState> {
  const fd = new FormData();
  fd.append("departementId", values.departementId);
  fd.append("name", values.name.trim());
  fd.append("code", values.code.trim());
  return updateCommune(communeId, fd);
}

export default function EditCommune({ commune, departements, onClose }: EditCommuneProps) {
  const close = onClose ?? (() => undefined);
  const queryClient = useQueryClient();
  const departementOptions = React.useMemo(
    () => toDepartementSelectOptions(departements),
    [departements]
  );

  const form = useForm<AddCommuneValues>({
    resolver: zodResolver(AddCommuneSchema),
    defaultValues: {
      departementId: commune.departementId,
      name: commune.name,
      code: commune.code ?? "",
    },
  });

  const { errors: formErrors } = useFormState({ control: form.control });
  const departementIdError = formErrors.departementId;
  const departementSelectClassNames = React.useMemo(
    () => geoReactSelectClassNames({ invalid: !!departementIdError }),
    [departementIdError]
  );

  const mutation = useMutation({
    mutationFn: (values: AddCommuneValues) => updateCommuneRequest(commune.id, values),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Commune mise à jour", {
          position: "top-right",
          style: { backgroundColor: appConfig.primaryColor, color: "white" },
        });
        queryClient.invalidateQueries({ queryKey: ["communes"] });
        close();
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

  const isPending = mutation.isPending;

  return (
    <>
      <DialogHeader>
        <DialogTitle style={{ color: appConfig.primaryColor }}>Modifier la commune</DialogTitle>
        <DialogDescription>
          Mettre à jour le département, le libellé ou le code. Les communes liées à des associations actives ne peuvent pas être supprimées.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4 pt-2"
        >
          <FormField
            control={form.control}
            name="departementId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">
                  Département{" "}
                  <span className="font-semibold" style={{ color: appConfig.secondaryColor }}>
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <DepartementSelectInner
                    field={field}
                    departementOptions={departementOptions}
                    selectClassNames={departementSelectClassNames}
                    departementIdError={!!departementIdError}
                    isPending={isPending}
                    departementsLength={departements.length}
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
                    placeholder="Nom de la commune"
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

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Code administratif</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    placeholder="Optionnel"
                    disabled={isPending}
                    autoComplete="off"
                    className="bg-background font-mono focus-visible:ring-2 focus-visible:ring-[color:var(--brand-ring)] focus-visible:ring-offset-2"
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
                form.reset({
                  departementId: commune.departementId,
                  name: commune.name,
                  code: commune.code ?? "",
                });
                close();
              }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending || departements.length === 0}
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
}
