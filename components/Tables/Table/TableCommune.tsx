"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { CommuneTableRow, DepartementOption } from "@/actions/settings/geo";
import { deleteCommune, fetchCommunesTable } from "@/actions/settings/geo";
import Delete from "@/components/Tables/Delete/Delete";
import Update from "@/components/Tables/Update/Update";
import View from "@/components/Tables/View/View";
import EditCommune from "@/components/forms/settings/editCommune";
import ViewCommune from "@/components/forms/settings/viewCommune";
import { ResourceTable } from "@/components/Tables/Table/resource-table";
import { Badge } from "@/components/ui/badge";

interface TableCommuneProps {
  initialData?: CommuneTableRow[];
  departements: DepartementOption[];
  canManageGeo?: boolean;
}

export default function TableCommune({
  initialData,
  departements,
  canManageGeo,
}: TableCommuneProps) {
  const columns = useMemo<ColumnDef<CommuneTableRow>[]>(() => {
    const base: ColumnDef<CommuneTableRow>[] = [
      {
        id: "region",
        header: "Région",
        cell: ({ row }) => (
          <span className="text-sm text-body dark:text-bodydark">
            {row.original.departement.region.name}
            <span className="ml-1 font-mono text-xs text-muted-foreground">
              ({row.original.departement.region.code})
            </span>
          </span>
        ),
      },
      {
        id: "departement",
        header: "Département",
        cell: ({ row }) => (
          <span className="text-sm text-body dark:text-bodydark">{row.original.departement.name}</span>
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
            <ViewCommune commune={row.original} />
          </View>
          {canManageGeo ? (
            <>
              <Update>
                <EditCommune commune={row.original} departements={departements} />
              </Update>
              <Delete
                id={row.original.id}
                invalidateQueryKey="communes"
                dialogTitle="Supprimer la commune"
                deleteFnct={deleteCommune}
              />
            </>
          ) : null}
        </div>
      ),
    });

    return base;
  }, [canManageGeo, departements]);

  return (
    <ResourceTable<CommuneTableRow>
      embedded
      queryKey="communes"
      queryFn={fetchCommunesTable}
      columns={columns}
      initialData={initialData}
    />
  );
}
