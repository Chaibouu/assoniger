/**
 * Chiffre les numéros de compte bancaire encore stockés en clair (migration ponctuelle).
 *
 * Usage : npm run data:encrypt-bank
 * Ré-exécutable sans risque : les valeurs déjà chiffrées sont ignorées.
 * Client Prisma brut (sans l'extension de lib/db.ts) pour lire la valeur réellement stockée.
 */

import { PrismaClient } from "@prisma/client";
import { encryptField, isEncryptedField } from "../lib/field-crypto";

try {
  process.loadEnvFile(".env");
} catch {
  // pas de fichier .env : variables fournies par l'environnement
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.association.findMany({
      where: { bankAccountNumber: { not: null } },
      select: { id: true, bankAccountNumber: true },
    });
    const plain = rows.filter((r) => r.bankAccountNumber && !isEncryptedField(r.bankAccountNumber));
    console.log(`${rows.length} numéro(s) en base, ${plain.length} à chiffrer.`);

    for (const row of plain) {
      await prisma.association.update({
        where: { id: row.id },
        data: { bankAccountNumber: encryptField(row.bankAccountNumber) },
      });
      console.log(`✓ ${row.id}`);
    }
    console.log("Migration terminée.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Erreur de migration :", error);
  process.exit(1);
});
