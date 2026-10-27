import { AssociationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { AssociationsGrid } from "@/components/site/AssociationsGrid";
import appConfig from "@/settings";

export const metadata = {
  title: `Explorer les associations — ${appConfig.appName}`,
  description: "Découvrez toutes les associations du Niger enregistrées sur la plateforme.",
};

export default async function AssociationsPublicPage() {
  const [associations, regions, domains, total] = await Promise.all([
    db.association.findMany({
      where: {
        isDeleted: false,
        status: { in: [AssociationStatus.ACTIVE, AssociationStatus.VERIFIED] },
      },
      select: {
        id: true,
        name: true,
        acronym: true,
        description: true,
        logoUrl: true,
        legalStatus: true,
        totalMembers: true,
        region: { select: { name: true, code: true } },
        domains: {
          where: { isDeleted: false },
          take: 3,
          include: { domain: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.region.findMany({ where: { isDeleted: false }, orderBy: { name: "asc" } }),
    db.domain.findMany({
      where: { isDeleted: false, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.association.count({
      where: {
        isDeleted: false,
        status: { in: [AssociationStatus.ACTIVE, AssociationStatus.VERIFIED] },
      },
    }),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <AssociationsGrid
        associations={associations}
        regions={regions}
        domains={domains}
        total={total}
      />
      <SiteFooter />
    </div>
  );
}
