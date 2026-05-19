import { AssociationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { SiteAbout } from "@/components/site/SiteAbout";
import { SiteAssociations } from "@/components/site/SiteAssociations";
import { SiteContact } from "@/components/site/SiteContact";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteHero } from "@/components/site/SiteHero";
import { SitePartners } from "@/components/site/SitePartners";
import { SiteStats } from "@/components/site/SiteStats";
import { SiteTestimonials } from "@/components/site/SiteTestimonials";

export async function PublicHomePage() {
  const [associations, totalAssociations, totalMembers, totalNeeds] = await Promise.all([
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
        region: { select: { code: true, name: true } },
        logoUrl: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    db.association.count({
      where: {
        isDeleted: false,
        status: { in: [AssociationStatus.ACTIVE, AssociationStatus.VERIFIED] },
      },
    }),
    db.associationMember.count({
      where: { isDeleted: false },
    }),
    db.associationNeed.count({
      where: {
        isDeleted: false,
        status: "OPEN",
      },
    }),
  ]);

  return (
    <main className="flex min-h-screen flex-col">
      <SiteHeader />
      <SiteHero />
      <SiteAbout />
      <SiteStats
        totalAssociations={totalAssociations}
        totalMembers={totalMembers}
        totalNeeds={totalNeeds}
      />
      <SiteAssociations
        associations={associations.map((a) => ({
          id: a.id,
          name: a.name,
          acronym: a.acronym,
          description: a.description,
          regionLabel: a.region?.name ?? a.region?.code ?? "",
          logoUrl: a.logoUrl,
        }))}
      />
      <SitePartners />
      <SiteTestimonials />
      <SiteContact />
      <div className="mt-auto">
        <SiteFooter />
      </div>
    </main>
  );
}
