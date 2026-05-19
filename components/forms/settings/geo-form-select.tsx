"use client";

import * as React from "react";
import Select, {
  type ClassNamesConfig,
  type GroupBase,
  type SelectInstance,
  type SingleValue,
  type StylesConfig,
} from "react-select";
import type { DepartementOption, RegionOption } from "@/actions/settings/geo";
import { cn } from "@/lib/utils";
import appConfig from "@/settings";

export type GeoSelectOption = { value: string; label: string };

function departementOptionLabel(d: DepartementOption): string {
  const deptPart = d.code ? `${d.name} (${d.code})` : d.name;
  return `${d.region.name} (${d.region.code}) · ${deptPart}`;
}

export function toRegionSelectOptions(regions: RegionOption[]): GeoSelectOption[] {
  return regions.map((r) => ({
    value: r.id,
    label: `${r.name} (${r.code})`,
  }));
}

export function toDepartementSelectOptions(departements: DepartementOption[]): GeoSelectOption[] {
  return departements.map((d) => ({
    value: d.id,
    label: departementOptionLabel(d),
  }));
}

/** Styles partagés avec les formulaires géo (réutilisable hors `GeoFormSelect`). */
export function buildGeoSelectStyles(
  primaryColor: string,
  ariaInvalid: boolean | undefined
): StylesConfig<GeoSelectOption, false> {
  const invalid = !!ariaInvalid;
  const focusRing = invalid ? "hsl(var(--destructive))" : primaryColor;

  return {
    control: (base, state) => ({
      ...base,
      minHeight: 40,
      borderRadius: "calc(var(--radius) - 2px)",
      borderWidth: 1,
      borderColor: invalid
        ? "hsl(var(--destructive))"
        : state.isFocused
          ? focusRing
          : "hsl(var(--input))",
      boxShadow:
        state.isFocused && !invalid
          ? `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${primaryColor}`
          : state.isFocused && invalid
            ? "0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--destructive))"
            : "none",
      outline: "none",
      backgroundColor: "hsl(var(--background))",
      cursor: state.isDisabled ? "not-allowed" : "default",
      opacity: state.isDisabled ? 0.6 : 1,
      "&:hover": {
        borderColor: invalid
          ? "hsl(var(--destructive))"
          : state.isFocused
            ? focusRing
            : "hsl(var(--input))",
      },
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({
      ...base,
      backgroundColor: "hsl(var(--popover))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "calc(var(--radius) - 2px)",
      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      overflow: "hidden",
      zIndex: 9999,
    }),
    option: (base, state) => ({
      ...base,
      cursor: "pointer",
      fontSize: "0.875rem",
      backgroundColor: state.isSelected
        ? "hsl(var(--accent))"
        : state.isFocused
          ? "hsl(var(--muted))"
          : "transparent",
      color: state.isSelected ? "hsl(var(--accent-foreground))" : "hsl(var(--popover-foreground))",
      "&:active": {
        backgroundColor: "hsl(var(--accent))",
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: "hsl(var(--foreground))",
    }),
    input: (base) => ({
      ...base,
      color: "hsl(var(--foreground))",
    }),
    placeholder: (base) => ({
      ...base,
      color: "hsl(var(--muted-foreground))",
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isDisabled
        ? "hsl(var(--muted-foreground))"
        : invalid
          ? "hsl(var(--destructive))"
          : primaryColor,
      transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : undefined,
      transition: "transform 0.15s ease",
    }),
  };
}

/** react-select `unstyled` + Tailwind — même look que le formulaire d’inscription. */
export function geoReactSelectClassNames(options?: {
  invalid?: boolean;
  /** Quand `styles` inclut `buildGeoSelectStyles` (focus vert en box-shadow), ne pas doubler avec ring Tailwind. */
  omitControlFocusRing?: boolean;
}): ClassNamesConfig<GeoSelectOption, false> {
  const invalid = !!options?.invalid;
  const omitControlFocusRing = !!options?.omitControlFocusRing;
  return {
    container: () => "relative w-full",
    control: (state) =>
      cn(
        "!min-h-10 h-10 w-full cursor-pointer rounded-md border bg-background px-1 shadow-sm",
        omitControlFocusRing && "!shadow-none",
        invalid ? "border-destructive" : "border-input",
        "hover:border-muted-foreground/35",
        !omitControlFocusRing &&
          state.isFocused &&
          (invalid
            ? "border-destructive ring-2 ring-destructive/25 ring-offset-2"
            : "ring-2 ring-[color:var(--brand-ring)] ring-offset-2")
      ),
    valueContainer: () => "flex min-w-0 flex-1 flex-wrap items-center gap-1 px-1.5 py-0.5",
    indicatorsContainer: () => "flex shrink-0 items-center gap-0.5 px-0.5",
    menu: () =>
      cn(
        "z-[100] rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md"
      ),
    menuList: () => "py-1 max-h-[280px]",
    option: (state) =>
      cn(
        "cursor-pointer px-3 py-2 text-sm",
        state.isFocused && "bg-accent text-accent-foreground",
        state.isSelected && "bg-primary/15 font-medium text-foreground"
      ),
    placeholder: () => "text-muted-foreground",
    singleValue: () => "text-foreground",
    input: () => "text-foreground",
    indicatorSeparator: () => "bg-border",
    dropdownIndicator: () => "cursor-pointer text-muted-foreground",
  };
}

export const geoReactSelectPortalStyles: StylesConfig<GeoSelectOption, false> = {
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
};

export type GeoFormSelectProps = {
  options: GeoSelectOption[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  inputId?: string;
  "aria-invalid"?: boolean;
};

export const GeoFormSelect = React.forwardRef<
  SelectInstance<GeoSelectOption, false, GroupBase<GeoSelectOption>>,
  GeoFormSelectProps
>(function GeoFormSelect(
  {
    options,
    value,
    onChange,
    onBlur,
    name,
    placeholder,
    disabled,
    inputId,
    "aria-invalid": ariaInvalid,
  },
  ref
) {
  const [menuPortalTarget, setMenuPortalTarget] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    setMenuPortalTarget(document.body);
  }, []);

  const styles = React.useMemo(
    () => buildGeoSelectStyles(appConfig.primaryColor, ariaInvalid),
    [ariaInvalid]
  );

  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  return (
    <Select<GeoSelectOption, false, GroupBase<GeoSelectOption>>
      ref={ref}
      name={name}
      inputId={inputId}
      instanceId={inputId ?? name ?? "geo-form-select"}
      options={options}
      value={selected}
      onChange={(opt: SingleValue<GeoSelectOption>) => {
        onChange(opt?.value ?? "");
      }}
      onBlur={onBlur}
      placeholder={placeholder}
      isDisabled={disabled}
      isClearable={false}
      isSearchable
      menuPortalTarget={menuPortalTarget ?? undefined}
      menuPosition="fixed"
      styles={styles}
      classNames={{
        control: () =>
          cn(
            "!shadow-none",
            ariaInvalid && "border-destructive"
          ),
      }}
      noOptionsMessage={() => "Aucun résultat"}
    />
  );
});
