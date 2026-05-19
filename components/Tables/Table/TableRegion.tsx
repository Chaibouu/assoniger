"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { RegionTableRow } from "@/actions/settings/geo";
import { deleteRegion, fetchRegionsTable } from "@/actions/settings/geo";
import Delete from "@/components/Tables/Delete/Delete";
import Update from "@/components/Tables/Update/Update";
import View from "@/components/Tables/View/View";
import EditRegion from "@/components/forms/settings/editRegion";
import ViewRegion from "@/components/forms/settings/viewRegion";
import { ResourceTable } from "@/components/Tables/Table/resource-table";
import { Badge } from "@/components/ui/badge";

interface TableRegionProps {
  initialData?: RegionTableRow[];
  /** Affiche modifier / supprimer (ADMIN / SUPER_ADMIN) */
  canManageGeo?: boolean;
}

export default function TableRegion({ initialData, canManageGeo }: TableRegionProps) {
  const columns = useMemo<ColumnDef<RegionTableRow>[]>(() => {
    const base: ColumnDef<RegionTableRow>[] = [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium text-black dark:text-white">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Libellé",
        cell: ({ row }) => (
          <span className="text-sm text-body dark:text-bodydark">{row.original.name}</span>
        ),
      },
      {
        id: "departements",
        header: "Départements",
        cell: ({ row }) => (
          <Badge variant="outline" className="border-primary/30 text-primary">
            {row.original._count.departements}
          </Badge>
        ),
      },
      {
        id: "communes",
        header: "Communes",
        cell: ({ row }) => (
          <Badge variant="outline" className="border-primary/30 text-primary">
            {row.original._count.communes}
          </Badge>
        ),
      },
    ];

    base.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap justify-center gap-4">
          <View>
            <ViewRegion region={row.original} />
          </View>
          {canManageGeo ? (
            <>
              <Update>
                <EditRegion region={row.original} />
              </Update>
              <Delete
                id={row.original.id}
                invalidateQueryKey="regions"
                dialogTitle="Supprimer la région"
                deleteFnct={deleteRegion}
              />
            </>
          ) : null}
        </div>
      ),
    });

    return base;
  }, [canManageGeo]);

  return (
    <ResourceTable<RegionTableRow>
      embedded
      queryKey="regions"
      queryFn={fetchRegionsTable}
      columns={columns}
      initialData={initialData}
    />
  );
}
