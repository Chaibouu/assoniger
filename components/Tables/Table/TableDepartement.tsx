"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { DepartementTableRow, RegionOption } from "@/actions/settings/geo";
import { deleteDepartement, fetchDepartementsTable } from "@/actions/settings/geo";
import Delete from "@/components/Tables/Delete/Delete";
import Update from "@/components/Tables/Update/Update";
import View from "@/components/Tables/View/View";
import EditDepartement from "@/components/forms/settings/editDepartement";
import ViewDepartement from "@/components/forms/settings/viewDepartement";
import { ResourceTable } from "@/components/Tables/Table/resource-table";
import { Badge } from "@/components/ui/badge";

interface TableDepartementProps {
  initialData?: DepartementTableRow[];
  regions: RegionOption[];
  canManageGeo?: boolean;
}

export default function TableDepartement({
  initialData,
  regions,
  canManageGeo,
}: TableDepartementProps) {
  const columns = useMemo<ColumnDef<DepartementTableRow>[]>(() => {
    const base: ColumnDef<DepartementTableRow>[] = [
      {
        id: "region",
        header: "Région",
        cell: ({ row }) => (
          <span className="text-sm text-body dark:text-bodydark">
            {row.original.region.name}
            <span className="ml-1 font-mono text-xs text-muted-foreground">
              ({row.original.region.code})
            </span>
          </span>
        ),
      },
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) =>
          row.original.code ? (
            <span className="font-mono text-sm font-medium text-black dark:text-white">
              {row.original.code}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
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
        id: "communes",
        header: "Communes",
        cell: ({ row }) => (
          <Badge variant="outline" className="border-primary/30 text-primary">
            {row.original._count.communes}
          </Badge>
        ),
      },
      {
        id: "associations",
        header: "Associations",
        cell: ({ row }) => (
          <Badge variant="outline" className="border-primary/30 text-primary">
            {row.original._count.associations}
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
            <ViewDepartement departement={row.original} />
          </View>
          {canManageGeo ? (
            <>
              <Update>
                <EditDepartement departement={row.original} regions={regions} />
              </Update>
              <Delete
                id={row.original.id}
                invalidateQueryKey="departements"
                dialogTitle="Supprimer le département"
                deleteFnct={deleteDepartement}
              />
            </>
          ) : null}
        </div>
      ),
    });

    return base;
  }, [canManageGeo, regions]);

  return (
    <ResourceTable<DepartementTableRow>
      embedded
      queryKey="departements"
      queryFn={fetchDepartementsTable}
      columns={columns}
      initialData={initialData}
    />
  );
}
