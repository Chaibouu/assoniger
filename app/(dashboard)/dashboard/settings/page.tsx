import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/actions/getUser";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ChevronRight, Map, MapPinned } from "lucide-react";
import { canAccessSettings } from "@/lib/settings-access";

const sections = [
  {
    href: "/dashboard/settings/region",
    title: "Régions",
    description:
      "Référentiel des régions utilisées pour les associations (aligné sur les données du système).",
    icon: Map,
  },
  {
    href: "/dashboard/settings/departement",
    title: "Départements",
    description:
      "Organisation administrative par département — préparation à l’extension du référentiel.",
    icon: Building2,
  },
  {
    href: "/dashboard/settings/commune",
    title: "Communes",
    description:
      "Communes et localités — préparation à la granularité communale.",
    icon: MapPinned,
  },
] as const;

export default async function DashboardSettingsPage() {
  const result = await getUser();
  const user = result?.user?.user;

  if (!user) {
    redirect("/auth/login");
  }
  if (!canAccessSettings(user.role)) {
    redirect("/unauthorized");
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">
          Paramètres
        </h1>
        <p className="mt-1 text-sm text-body dark:text-bodydark">
          Référentiels géographiques et paramètres territoriaux de la plateforme.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ href, title, description, icon: Icon }) => (
          <Link key={href} href={href} className="group block rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary">
            <Card className="h-full border border-stroke bg-white shadow-sm transition-colors hover:border-primary/40 dark:border-strokedark dark:bg-boxdark">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/15">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-1 text-lg font-semibold text-black dark:text-white">
                    {title}
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                  </CardTitle>
                  <CardDescription className="mt-1.5 text-sm leading-relaxed">
                    {description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
