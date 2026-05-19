import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/actions/getUser";
import {
  fetchDepartementsTable,
  fetchRegionsOptions,
} from "@/actions/settings/geo";
import ButtonAddDepartement from "@/components/Buttons/ButtonAddDepartement";
import TableDepartement from "@/components/Tables/Table/TableDepartement";
import { canAccessSettings } from "@/lib/settings-access";
import { ArrowLeft } from "lucide-react";

export default async function DashboardSettingsDepartementPage() {
  const result = await getUser();
  const user = result?.user?.user;

  if (!user) {
    redirect("/auth/login");
  }
  if (!canAccessSettings(user.role)) {
    redirect("/unauthorized");
  }

  const canManageGeo = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const [departements, regionsOptions] = await Promise.all([
    fetchDepartementsTable(),
    fetchRegionsOptions(),
  ]);

  return (
    <>
      <Link
        href="/dashboard/settings"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Retour aux paramètres
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
            Départements
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chaque département appartient à une région ; les communes y sont rattachées.
          </p>
        </div>
        {canManageGeo ? <ButtonAddDepartement regions={regionsOptions} /> : null}
      </div>

      <TableDepartement
        initialData={departements}
        regions={regionsOptions}
        canManageGeo={canManageGeo}
      />
    </>
  );
}
