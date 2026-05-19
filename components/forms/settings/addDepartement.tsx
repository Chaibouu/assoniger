"use client";

import type { CSSProperties } from "react";
import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState, type ControllerProps } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { RegionOption } from "@/actions/settings/geo";
import type { CreateDepartementState } from "@/actions/settings/geo";
import { createDepartement } from "@/actions/settings/geo";
import { AddDepartementSchema, type AddDepartementValues } from "@/schemas/departements";
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
  buildGeoSelectStyles,
  geoReactSelectClassNames,
  geoReactSelectPortalStyles,
  toRegionSelectOptions,
  type GeoSelectOption,
} from "@/components/forms/settings/geo-form-select";
import appConfig from "@/settings";

type RegionIdField = Parameters<
  NonNullable<ControllerProps<AddDepartementValues, "regionId">["render"]>
>[0]["field"];

function RegionSelectInner({
  field,
  regionOptions,
  regionSelectClassNames,
  regionIdError,
  isPending,
  regionsLength,
}: {
  field: RegionIdField;
  regionOptions: GeoSelectOption[];
  regionSelectClassNames: ReturnType<typeof geoReactSelectClassNames>;
  regionIdError: boolean;
  isPending: boolean;
  regionsLength: number;
}) {
  const { formItemId } = useFormField();

  const regionSelectStyles = React.useMemo(
    () => ({
      ...buildGeoSelectStyles(appConfig.primaryColor, regionIdError),
      ...geoReactSelectPortalStyles,
    }),
    [regionIdError]
  );

  return (
    <div
      className="relative w-full"
      style={{ "--brand-ring": appConfig.primaryColor } as CSSProperties}
    >
      <Select<GeoSelectOption, false, GroupBase<GeoSelectOption>>
        unstyled
        instanceId="add-departement-region"
        inputId={formItemId}
        name={field.name}
        ref={field.ref}
        options={regionOptions}
        value={regionOptions.find((o) => o.value === field.value) ?? null}
        onChange={(opt: SingleValue<GeoSelectOption>) => field.onChange(opt?.value ?? "")}
        onBlur={field.onBlur}
        placeholder="Choisir une région"
        isDisabled={isPending || regionsLength === 0}
        isClearable={false}
        isSearchable
        menuPosition="absolute"
        menuPlacement="auto"
        styles={regionSelectStyles}
        classNames={regionSelectClassNames}
        aria-invalid={regionIdError}
        noOptionsMessage={() => "Aucune région"}
      />
    </div>
  );
}

export type { AddDepartementValues };

export interface AddDepartementProps {
  regions: RegionOption[];
  onClose: () => void;
}

async function createDepartementRequest(values: AddDepartementValues): Promise<CreateDepartementState> {
  const fd = new FormData();
  fd.append("regionId", values.regionId);
  fd.append("name", values.name.trim());
  fd.append("code", values.code.trim());
  return createDepartement(fd);
}

const AddDepartement = ({ regions, onClose }: AddDepartementProps) => {
  const queryClient = useQueryClient();
  const defaultRegionId = regions[0]?.id ?? "";
  const regionOptions = React.useMemo(() => toRegionSelectOptions(regions), [regions]);

  const form = useForm<AddDepartementValues>({
    resolver: zodResolver(AddDepartementSchema),
    defaultValues: {
      regionId: defaultRegionId,
      name: "",
      code: "",
    },
  });

  const { errors: formErrors } = useFormState({ control: form.control });
  const regionIdError = formErrors.regionId;
  const regionSelectClassNames = React.useMemo(
    () =>
      geoReactSelectClassNames({
        invalid: !!regionIdError,
        omitControlFocusRing: true,
      }),
    [regionIdError]
  );

  const mutation = useMutation({
    mutationFn: createDepartementRequest,
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Département créé", {
          position: "top-right",
          style: { backgroundColor: appConfig.primaryColor, color: "white" },
        });
        queryClient.invalidateQueries({ queryKey: ["departements"] });
        form.reset({ regionId: regions[0]?.id ?? "", name: "", code: "" });
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

  const onSubmit = (data: AddDepartementValues) => {
    mutation.mutate(data);
  };

  const isPending = mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="regionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">
                Région{" "}
                <span className="font-semibold" style={{ color: appConfig.secondaryColor }}>
                  *
                </span>
              </FormLabel>
              <FormControl>
                <RegionSelectInner
                  field={field}
                  regionOptions={regionOptions}
                  regionSelectClassNames={regionSelectClassNames}
                  regionIdError={!!regionIdError}
                  isPending={isPending}
                  regionsLength={regions.length}
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
                  placeholder="Nom du département"
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
              form.reset({ regionId: regions[0]?.id ?? "", name: "", code: "" });
              onClose();
            }}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isPending || regions.length === 0}
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

export default AddDepartement;
