import { getUser } from "@/actions/getUser";
import { fetchPendingAssociationsTable } from "@/actions/associations/pending-table";
import appConfig from "@/settings";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TablePendingAssociations from "@/components/Tables/Table/TablePendingAssociations";

function isModerationStaff(role: UserRole) {
  return (
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MODERATOR
  );
}

export default async function AssociationsPendingPage() {
  const result = await getUser();
  const user = result?.user?.user;

  if (!user) {
    redirect("/auth/login");
  }
  if (!isModerationStaff(user.role)) {
    redirect("/unauthorized");
  }

  const initialData = await fetchPendingAssociationsTable();
  const count = initialData.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: appConfig.primaryColor }}>
            Associations en attente de validation
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {count === 0
              ? "Aucune demande en attente."
              : `${count} association${count > 1 ? "s" : ""} en attente (statut « En attente »).`}
          </p>
        </div>
        <Link
          href="/dashboard/associations"
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium"
          style={{ borderColor: `${appConfig.primaryColor}77`, color: appConfig.primaryColor }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Liste complète
        </Link>
      </div>

      <TablePendingAssociations initialData={initialData} />

      <p className="text-xs text-muted-foreground">
        Ouvrez la fiche dossier (icône œil) pour consulter les pièces jointes et prévisualiser le PDF du récépissé.
      </p>
    </div>
  );
}
