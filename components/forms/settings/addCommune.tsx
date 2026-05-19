"use client";

import type { CSSProperties } from "react";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState, type ControllerRenderProps } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateCommuneState, DepartementOption } from "@/actions/settings/geo";
import { createCommune } from "@/actions/settings/geo";
import { AddCommuneSchema, type AddCommuneValues } from "@/schemas/communes";
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
        instanceId="add-commune-departement"
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

export type { AddCommuneValues };

export interface AddCommuneProps {
  departements: DepartementOption[];
  onClose: () => void;
}

async function createCommuneRequest(values: AddCommuneValues): Promise<CreateCommuneState> {
  const fd = new FormData();
  fd.append("departementId", values.departementId);
  fd.append("name", values.name.trim());
  fd.append("code", values.code.trim());
  return createCommune(fd);
}

const AddCommune = ({ departements, onClose }: AddCommuneProps) => {
  const queryClient = useQueryClient();
  const defaultDeptId = departements[0]?.id ?? "";
  const departementOptions = React.useMemo(
    () => toDepartementSelectOptions(departements),
    [departements]
  );

  const form = useForm<AddCommuneValues>({
    resolver: zodResolver(AddCommuneSchema),
    defaultValues: {
      departementId: defaultDeptId,
      name: "",
      code: "",
    },
  });

  const { errors: formErrors } = useFormState({ control: form.control });
  const departementIdError = formErrors.departementId;
  const departementSelectClassNames = React.useMemo(
    () => geoReactSelectClassNames({ invalid: !!departementIdError }),
    [departementIdError]
  );

  const mutation = useMutation({
    mutationFn: createCommuneRequest,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Commune créée", {
          position: "top-right",
          style: { backgroundColor: appConfig.primaryColor, color: "white" },
        });
        queryClient.invalidateQueries({ queryKey: ["communes"] });
        form.reset({ departementId: departements[0]?.id ?? "", name: "", code: "" });
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

  const onSubmit = (data: AddCommuneValues) => {
    mutation.mutate(data);
  };

  const isPending = mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              form.reset({ departementId: departements[0]?.id ?? "", name: "", code: "" });
              onClose();
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
  );
};

export default AddCommune;
