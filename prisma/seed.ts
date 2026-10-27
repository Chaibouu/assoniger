import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { GEO_SEED_TREE } from "../lib/geo-seed-data";
import { REGION_LABELS } from "../lib/geo-labels";

// `npm run seed` lance ts-node directement : charger `.env` (Node ≥ 20.6).
// Ignoré si le fichier est absent (variables déjà fournies par l'environnement, ex. CI).
try {
  process.loadEnvFile(".env");
} catch {
  // pas de fichier .env
}

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

/** Identifiants du super-admin initial, lus depuis `.env` (jamais en dur dans le code). */
function readSuperAdminSeedConfig() {
  const email = process.env.SUPER_ADMIN_EMAIL?.trim();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  const name = process.env.SUPER_ADMIN_NAME?.trim() || "Super administrateur";
  // "true" : réinitialise le mot de passe d'un compte déjà existant avec SUPER_ADMIN_PASSWORD
  const resetPassword = process.env.SUPER_ADMIN_RESET_PASSWORD?.trim().toLowerCase() === "true";

  if (!email || !password) {
    throw new Error(
      "SUPER_ADMIN_EMAIL et SUPER_ADMIN_PASSWORD doivent être définis dans .env pour créer le super-admin."
    );
  }
  if (password.length < 12) {
    throw new Error("SUPER_ADMIN_PASSWORD doit contenir au moins 12 caractères.");
  }

  return { name, email, password, resetPassword };
}

async function main() {
  await seedGeoReferential();

  console.log("Seeding super-admin...");
  const config = readSuperAdminSeedConfig();
  const hashedPassword = await bcrypt.hash(config.password, 12);

  const existing = await prisma.user.findFirst({
    where: { email: { equals: config.email, mode: "insensitive" } },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        name: config.name,
        email: config.email,
        role: UserRole.SUPER_ADMIN,
        emailVerified: new Date(),
        password: hashedPassword,
      },
    });
    console.log("Super-admin créé.");
  } else if (config.resetPassword) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashedPassword },
    });
    // Invalide les sessions ouvertes avec l'ancien mot de passe
    await prisma.session.deleteMany({ where: { userId: existing.id } });
    console.log("Mot de passe du super-admin réinitialisé.");
  } else {
    console.log("Super-admin déjà présent (SUPER_ADMIN_RESET_PASSWORD=true pour réinitialiser le mot de passe).");
  }
}

main()
  .catch((error) => {
    console.error("Error seeding data:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
