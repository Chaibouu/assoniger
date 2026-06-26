import { Building2, Users } from "lucide-react";
import appConfig from "@/settings";

type SiteStatsProps = {
  totalAssociations: number;
  totalMembers: number;
};

export function SiteStats({ totalAssociations, totalMembers }: SiteStatsProps) {
  const items = [
    {
      icon: Building2,
      value: totalAssociations,
      label: "Associations actives",
      sub: "Enregistrées et vérifiées",
      accent: appConfig.primaryColor,
    },
    {
      icon: Users,
      value: totalMembers,
      label: "Membres référencés",
      sub: "À travers tout le Niger",
      accent: appConfig.secondaryColor,
    },
  ];

  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="grid divide-y divide-gray-100 border-b border-t border-gray-100 md:grid-cols-2 md:divide-x md:divide-y-0">
          {items.map(({ icon: Icon, value, label, sub, accent }) => (
            <article key={label} className="group flex items-center gap-5 px-8 py-12 transition-all duration-200 hover:bg-gray-50">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${accent}15` }}
              >
                <Icon className="h-7 w-7" style={{ color: accent }} aria-hidden="true" />
              </div>
              <div>
                <p
                  className="text-4xl font-black tabular-nums"
                  style={{ color: accent }}
                >
                  {value.toLocaleString("fr-FR")}
                </p>
                <p className="mt-0.5 text-sm font-bold text-gray-800">{label}</p>
                <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
