"use client";

import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/Tables/DataTables/data-table";

export interface ResourceTableProps<TData> {
  title?: string;
  subTitle?: string;
  /** Sans bloc titre — pour intégrer sous un en-tête de page existant */
  embedded?: boolean;
  /** Clé TanStack Query + invalidation côté `DataTable` */
  queryKey: string;
  queryFn: () => Promise<TData[]>;
  columns: ColumnDef<TData>[];
  /** Données SSR / préchargées (comme `initialData` des anciens tableaux) */
  initialData?: TData[];
}

/**
 * En-tête + `useQuery` + `DataTable` — même comportement que les anciens `Tableeee/*`.
 */
export function ResourceTable<TData>({
  title,
  subTitle,
  embedded = false,
  queryKey,
  queryFn,
  columns,
  initialData,
}: ResourceTableProps<TData>) {
  const { data } = useQuery({
    queryKey: [queryKey],
    queryFn,
    initialData,
  });

  const rows = data ?? [];

  const table = (
    <DataTable<TData> data={rows} columns={columns} queryKey={queryKey} />
  );

  if (embedded) {
    return (
      <div className="overflow-hidden rounded-xl border border-stroke bg-white shadow-sm dark:border-strokedark dark:bg-boxdark">
        {table}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col space-y-8 border bg-white p-8 shadow">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-nt__primary">{subTitle}</p>
        </div>
      </div>
      {table}
    </div>
  );
}
