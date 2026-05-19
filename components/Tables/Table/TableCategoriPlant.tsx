"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ResourceTable } from "@/components/Tables/Table/resource-table";
import Delete from "@/components/Tables/Delete/Delete";
import Update from "@/components/Tables/Update/Update";
import { deleteCategoriPlant, fetchCategoriPlant } from "@/actions/CategoriPlant";
import UpdateCategoriPlant from "@/components/Forms/Update/UpdateCategoriPlant";

export interface CategoriPlantRow {
  id: string;
  name: string;
  description: string;
}

interface TableProps {
  title: string;
  subTitle: string;
  categoriplants?: CategoriPlantRow[];
}

const TableCategoriPlant = ({ title, subTitle, categoriplants }: TableProps) => {
  const loadCategories = async () => {
    const res = await fetchCategoriPlant();
    return res.categoriplant as CategoriPlantRow[];
  };

  const columns: ColumnDef<CategoriPlantRow>[] = [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex flex-wrap justify-center gap-4">
          <Update>
            <UpdateCategoriPlant categoriplant={row.original} />
          </Update>
          <Delete
            id={row.original.id}
            title="categoriplants"
            deleteFnct={deleteCategoriPlant}
          />
        </div>
      ),
    },
  ];

  return (
    <ResourceTable<CategoriPlantRow>
      title={title}
      subTitle={subTitle}
      queryKey="categoriplants"
      queryFn={loadCategories}
      columns={columns}
      initialData={categoriplants}
    />
  );
};

export default TableCategoriPlant;
