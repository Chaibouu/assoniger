import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import { AssociationStatus, Prisma, UserRole } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import appConfig from "@/settings";
import { Eye, Pencil, Power, PowerOff } from "lucide-react";
import { AssociationDeleteDialog } from "@/components/dashboard/AssociationDeleteDialog";
import {
  deleteAssociationAction,
  toggleAssociationStatusAction,
} from "@/actions/associations/association-admin-actions";

const statusLabel: Record<AssociationStatus, string> = {
  PENDING: "En attente",
  VERIFIED: "Verifiee",
  ACTIVE: "Active",
  REJECTED: "Rejetee",
  SUSPENDED: "Suspendue",
  INACTIVE: "Inactive",
  DELETED: "Supprimee",
};

const statusBadgeStyle: Record<
  AssociationStatus,
  { backgroundColor: string; color: string }
> = {
  PENDING: { backgroundColor: `${appConfig.secondaryColor}22`, color: appConfig.secondaryColor },
  VERIFIED: { backgroundColor: `${appConfig.primaryColor}22`, color: appConfig.primaryColor },
  ACTIVE: { backgroundColor: `${appConfig.primaryColor}22`, color: appConfig.primaryColor },
  REJECTED: { backgroundColor: `${appConfig.secondaryColor}22`, color: appConfig.secondaryColor },
  SUSPENDED: { backgroundColor: `${appConfig.secondaryColor}22`, color: appConfig.secondaryColor },
  INACTIVE: { backgroundColor: "#64748B22", color: "#64748B" },
  DELETED: { backgroundColor: "#47556922", color: "#475569" },
};

type AssociationsPageProps = {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    region?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 10;

function buildQueryString(
  params: { q: string; status: string; region: string; page: number },
  nextPage?: number
) {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.status) query.set("status", params.status);
  if (params.region) query.set("region", params.region);
  query.set("page", String(nextPage ?? params.page));
  return query.toString();
}

export default async function DashboardAssociationsPage({
  searchParams,
}: AssociationsPageProps) {
  const resolvedSearchParams = await searchParams;
  const result = await getUser();
  const currentUser = result?.user?.user;

  if (!currentUser) {
    redirect("/auth/login");
  }

  if (
    currentUser.role !== UserRole.ADMIN &&
    currentUser.role !== UserRole.SUPER_ADMIN &&
    currentUser.role !== UserRole.MODERATOR &&
    currentUser.role !== UserRole.ASSOCIATION
  ) {
    redirect("/unauthorized");
  }

  const q = (resolvedSearchParams?.q ?? "").trim();
  const statusParam = (resolvedSearchParams?.status ?? "").trim();
  const regionParam = (resolvedSearchParams?.region ?? "").trim();
  const currentPage = Math.max(Number(resolvedSearchParams?.page ?? "1") || 1, 1);

  const where: Prisma.AssociationWhereInput = {
    ...( { isDeleted: false } as Prisma.AssociationWhereInput),
  };

  const isModerationStaff =
    currentUser.role === UserRole.ADMIN ||
    currentUser.role === UserRole.SUPER_ADMIN ||
    currentUser.role === UserRole.MODERATOR;

  if (!isModerationStaff) {
    where.userId = currentUser.id;
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { acronym: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { contactEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  if (
    statusParam &&
    Object.values(AssociationStatus).includes(statusParam as AssociationStatus)
  ) {
    where.status = statusParam as AssociationStatus;
  }

  if (regionParam) {
    where.region = { code: regionParam, isDeleted: false };
  }

  const [regionsForFilter, total, associations] = await Promise.all([
    db.region.findMany({
      where: { isDeleted: false },
      select: { code: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.association.count({ where }),
    db.association.findMany({
      where,
      select: {
        id: true,
        name: true,
        acronym: true,
        status: true,
        userId: true,
        region: { select: { code: true, name: true } },
        legalStatus: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: appConfig.primaryColor }}
        >
          Liste des associations
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {total} association{total > 1 ? "s" : ""} trouvee{total > 1 ? "s" : ""}
          {currentUser.role === UserRole.ADMIN ? "" : " pour votre compte"}.
        </p>
      </div>

      <form
        method="GET"
        className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-boxdark md:grid-cols-4"
        style={{
          borderColor: `${appConfig.primaryColor}44`,
          backgroundColor: `${appConfig.primaryColor}08`,
        }}
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Rechercher une association..."
          className="h-10 rounded-md border border-gray-300 bg-transparent px-3 text-sm outline-none focus:border-gray-500 dark:border-gray-600"
          style={{ borderColor: `${appConfig.primaryColor}66` }}
        />
        <select
          name="status"
          defaultValue={statusParam}
          className="h-10 rounded-md border border-gray-300 bg-transparent px-3 text-sm outline-none focus:border-gray-500 dark:border-gray-600"
          style={{ borderColor: `${appConfig.primaryColor}66` }}
        >
          <option value="">Tous les statuts</option>
          {Object.values(AssociationStatus).map((status) => (
            <option key={status} value={status}>
              {statusLabel[status]}
            </option>
          ))}
        </select>
        <select
          name="region"
          defaultValue={regionParam}
          className="h-10 rounded-md border border-gray-300 bg-transparent px-3 text-sm outline-none focus:border-gray-500 dark:border-gray-600"
          style={{ borderColor: `${appConfig.primaryColor}66` }}
        >
          <option value="">Toutes les regions</option>
          {regionsForFilter.map((region) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-10 rounded-md px-4 text-sm font-medium text-white transition"
          style={{ backgroundColor: appConfig.primaryColor }}
        >
          Filtrer
        </button>
      </form>

      <div
        className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden"
        style={{ borderColor: `${appConfig.primaryColor}44` }}
      >
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1100px] divide-y divide-gray-200 dark:divide-gray-700">
          <thead
            className="dark:bg-gray-800"
            style={{ backgroundColor: `${appConfig.primaryColor}14` }}
          >
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: appConfig.primaryColor }}
              >
                Association
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: appConfig.primaryColor }}
              >
                Statut
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: appConfig.primaryColor }}
              >
                Region
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: appConfig.primaryColor }}
              >
                Contact
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: appConfig.primaryColor }}
              >
                Creee le
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                style={{ color: appConfig.primaryColor }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {associations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                  Aucune association trouvee.
                </td>
              </tr>
            )}

            {associations.map((association) => (
              <tr
                key={association.id}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {association.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {association.acronym || "Sans sigle"} - {association.legalStatus}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={statusBadgeStyle[association.status]}
                  >
                    {statusLabel[association.status]}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {association.region?.name ?? association.region?.code ?? "—"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <div className="space-y-1">
                    <p>{association.contactEmail}</p>
                    <p className="text-xs text-gray-500">{association.contactPhone}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                  {new Date(association.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/dashboard/associations/${association.id}`}
                      title="Voir details"
                      aria-label="Voir details"
                      className="inline-flex items-center justify-center rounded-md border p-2 text-xs font-medium"
                      style={{
                        borderColor: `${appConfig.primaryColor}77`,
                        color: appConfig.primaryColor,
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/dashboard/associations/${association.id}?mode=edit`}
                      title="Modifier"
                      aria-label="Modifier"
                      className="inline-flex items-center justify-center rounded-md border p-2 text-xs font-medium"
                      style={{
                        borderColor: `${appConfig.secondaryColor}77`,
                        color: appConfig.secondaryColor,
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Link>
                    {isModerationStaff ? (
                    <form action={toggleAssociationStatusAction}>
                      <input type="hidden" name="associationId" value={association.id} />
                      <button
                        type="submit"
                        title={
                          association.status === AssociationStatus.ACTIVE
                            ? "Desactiver"
                            : "Activer"
                        }
                        aria-label={
                          association.status === AssociationStatus.ACTIVE
                            ? "Desactiver"
                            : "Activer"
                        }
                        className="inline-flex items-center justify-center rounded-md border p-2 text-xs font-medium"
                        style={{
                          borderColor: `${appConfig.primaryColor}77`,
                          color: appConfig.primaryColor,
                        }}
                      >
                        {association.status === AssociationStatus.ACTIVE ? (
                          <PowerOff className="h-3.5 w-3.5" />
                        ) : (
                          <Power className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </form>
                    ) : null}
                    <AssociationDeleteDialog
                      associationId={association.id}
                      associationName={association.name}
                      deleteAction={deleteAssociationAction}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>

      <div
        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-boxdark"
        style={{ borderColor: `${appConfig.secondaryColor}44` }}
      >
        <p className="text-gray-500 dark:text-gray-400">
          Page {currentPage} sur {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={`?${buildQueryString(
              { q, status: statusParam, region: regionParam, page: currentPage },
              currentPage - 1
            )}`}
            aria-disabled={!hasPreviousPage}
            className={`rounded-md border px-3 py-1.5 ${
              hasPreviousPage
                ? "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                : "pointer-events-none border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600"
            }`}
            style={
              hasPreviousPage
                ? { borderColor: `${appConfig.secondaryColor}77`, color: appConfig.secondaryColor }
                : undefined
            }
          >
            Precedent
          </Link>
          <Link
            href={`?${buildQueryString(
              { q, status: statusParam, region: regionParam, page: currentPage },
              currentPage + 1
            )}`}
            aria-disabled={!hasNextPage}
            className={`rounded-md border px-3 py-1.5 ${
              hasNextPage
                ? "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                : "pointer-events-none border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-600"
            }`}
            style={
              hasNextPage
                ? { borderColor: `${appConfig.secondaryColor}77`, color: appConfig.secondaryColor }
                : undefined
            }
          >
            Suivant
          </Link>
        </div>
      </div>
    </div>
  );
}
