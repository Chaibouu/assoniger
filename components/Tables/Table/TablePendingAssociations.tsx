"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";
import { Eye } from "lucide-react";
import { AssociationStatus } from "@prisma/client";
import type { PendingAssociationTableRow } from "@/actions/associations/pending-table";
import { fetchPendingAssociationsTable } from "@/actions/associations/pending-table";
import { ResourceTable } from "@/components/Tables/Table/resource-table";
import { Badge } from "@/components/ui/badge";
import appConfig from "@/settings";

const statusLabelFr: Record<AssociationStatus, string> = {
  PENDING: "En attente",
  VERIFIED: "Vérifiée",
  ACTIVE: "Active",
  REJECTED: "Rejetée",
  SUSPENDED: "Suspendue",
  INACTIVE: "Inactive",
  DELETED: "Supprimée",
};
interface TablePendingAssociationsProps {
  initialData?: PendingAssociationTableRow[];
}

export default function TablePendingAssociations({ initialData }: TablePendingAssociationsProps) {
  const columns = useMemo<ColumnDef<PendingAssociationTableRow>[]>(
    () => [
      {
        id: "association",
        header: "Association",
        cell: ({ row }) => (
          <div className="text-left">
            <span className="text-sm font-medium text-black dark:text-white">{row.original.name}</span>
            <p className="text-xs text-muted-foreground">
              {row.original.acronym || "Sans sigle"} · {row.original.legalStatus}
            </p>
          </div>
        ),
      },
      {
        id: "region",
        header: "Région",
        cell: ({ row }) => (
          <span className="text-sm text-body dark:text-bodydark">
            {row.original.region?.name ?? row.original.region?.code ?? "—"}
          </span>
        ),
      },
      {
        id: "status",
        header: "Statut",
        cell: ({ row }) => {
          const s = row.original.status;
          const isPending = s === AssociationStatus.PENDING;
          return (
            <Badge
              variant="outline"
              className={
                isPending
                  ? "border-amber-500/45 bg-amber-500/10 font-medium text-amber-950 dark:text-amber-100"
                  : "border-border font-medium"
              }
            >
              {statusLabelFr[s] ?? s}
            </Badge>
          );
        },
      },
      {
        id: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <div className="space-y-1 text-left">
            <p className="break-all text-sm text-body dark:text-bodydark">{row.original.contactEmail}</p>
            <p className="text-xs text-muted-foreground">{row.original.contactPhone}</p>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Créée le",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-body dark:text-bodydark">
            {new Date(row.original.createdAt).toLocaleDateString("fr-FR")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={`/dashboard/associations/pending/${row.original.id}`}
              title={`Voir le dossier d'inscription`}
              aria-label={`Voir le dossier d'inscription — ${row.original.name}`}
              className="inline-flex items-center justify-center rounded-md border p-2 text-xs font-medium transition-opacity hover:opacity-90"
              style={{
                borderColor: `${appConfig.primaryColor}77`,
                color: appConfig.primaryColor,
              }}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <ResourceTable<PendingAssociationTableRow>
      embedded
      queryKey="associations-pending"
      queryFn={fetchPendingAssociationsTable}
      columns={columns}
      initialData={initialData}
    />
  );
}
