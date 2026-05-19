"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { ResourceTable } from "@/components/Tables/Table/resource-table";
import Delete from "@/components/Tables/Delete/Delete";
import Update from "@/components/Tables/Update/Update";
import UpdatePlant from "@/components/Forms/Update/UpdatePlant";
import { deleteProduit, fetchProduit } from "@/actions/produit";

interface CategoriPlantRef {
  id: string;
  name: string;
}

export interface ProduitRow {
  id: string;
  name: string;
  price: string;
  category: CategoriPlantRef;
  imageUrl?: File | string | undefined;
}

interface TableProps {
  title: string;
  subTitle: string;
  plants?: ProduitRow[];
}

const TablePlant = ({ title, subTitle, plants }: TableProps) => {
  const loadProduits = async () => {
    const res = await fetchProduit();
    return res.produit as ProduitRow[];
  };

  const columns: ColumnDef<ProduitRow>[] = [
    {
      accessorKey: "name",
      header: "Produit",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "price",
      header: "Prix",
      cell: ({ row }) => <div>{row.getValue("price")}</div>,
    },
    {
      accessorKey: "imageUrl",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.getValue("imageUrl") as string | undefined;
        return (
          <div>
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt="Image du produit"
                width={50}
                height={50}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="italic text-gray-500">Pas d&apos;image</span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex justify-center gap-4">
          <Update>
            <UpdatePlant produit={row.original} />
          </Update>
          <Delete id={row.original.id} title="produits" deleteFnct={deleteProduit} />
        </div>
      ),
    },
  ];

  return (
    <ResourceTable<ProduitRow>
      title={title}
      subTitle={subTitle}
      queryKey="produits"
      queryFn={loadProduits}
      columns={columns}
      initialData={plants}
    />
  );
};

export default TablePlant;
