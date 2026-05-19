import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { GEO_SEED_TREE } from "../lib/geo-seed-data";
import { REGION_LABELS } from "../lib/geo-labels";

const prisma = new PrismaClient();

async function upsertDepartement(regionId: string, name: string) {
  const existing = await prisma.departement.findFirst({
    where: { regionId, name },
  });
  if (existing) {
    return prisma.departement.update({
      where: { id: existing.id },
      data: { isDeleted: false },
    });
  }
  return prisma.departement.create({
    data: { regionId, name },
  });
}

async function upsertCommune(departementId: string, name: string) {
  const existing = await prisma.commune.findFirst({
    where: { departementId, name },
  });
  if (existing) {
    return prisma.commune.update({
      where: { id: existing.id },
      data: { isDeleted: false },
    });
  }
  return prisma.commune.create({
    data: { departementId, name },
  });
}

/** Charge ou met à jour le référentiel depuis `lib/geo-seed-data.ts` (idempotent). */
async function seedGeoReferential() {
  console.log("Référentiel géographique (upsert régions / départements / communes)...");
  for (const entry of GEO_SEED_TREE) {
    const region = await prisma.region.upsert({
      where: { code: entry.code },
      create: {
        code: entry.code,
        name: REGION_LABELS[entry.code],
      },
      update: {
        name: REGION_LABELS[entry.code],
        isDeleted: false,
      },
    });

    for (const dept of entry.departements) {
      const dRow = await upsertDepartement(region.id, dept.name);
      for (const communeName of dept.communes) {
        await upsertCommune(dRow.id, communeName);
      }
    }
  }
  console.log("Référentiel géographique à jour.");
}

const admins = [
  {
    name: "Admin User",
    email: "admin@gmail.com",
    role: UserRole.ADMIN,
    emailVerified: new Date(),
  },
];

async function main() {
  await seedGeoReferential();

  console.log("Seeding admin...");
  for (const admin of admins) {
    const existingAdmin = await prisma.user.findFirst({
      where: { email: admin.email },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin", 10);
      await prisma.user.create({
        data: {
          name: admin.name,
          email: admin.email,
          role: admin.role,
          emailVerified: admin.emailVerified,
          password: hashedPassword,
        },
      });
    }
  }
  console.log("admin seeded successfully!");
}

main()
  .catch((error) => {
    console.error("Error seeding data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
