import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/actions/getUser";
import {
  fetchCommunesTable,
  fetchDepartementsOptions,
} from "@/actions/settings/geo";
import ButtonAddCommune from "@/components/Buttons/ButtonAddCommune";
import TableCommune from "@/components/Tables/Table/TableCommune";
import { canAccessSettings } from "@/lib/settings-access";
import { ArrowLeft } from "lucide-react";

export default async function DashboardSettingsCommunePage() {
  const result = await getUser();
  const user = result?.user?.user;

  if (!user) {
    redirect("/auth/login");
  }
  if (!canAccessSettings(user.role)) {
    redirect("/unauthorized");
  }

  const canManageGeo = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

  const [communes, departementsOptions] = await Promise.all([
    fetchCommunesTable(),
    fetchDepartementsOptions(),
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
            Communes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chaque commune est rattachée à un département (lui-même lié à une région).
          </p>
        </div>
        {canManageGeo ? <ButtonAddCommune departements={departementsOptions} /> : null}
      </div>

      <TableCommune
        initialData={communes}
        departements={departementsOptions}
        canManageGeo={canManageGeo}
      />
    </>
  );
}
