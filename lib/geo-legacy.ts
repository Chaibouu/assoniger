import { db } from "@/lib/db";

/** Département / commune placeholders créés par la migration pour les anciennes données texte. */
export const LEGACY_DEPARTEMENT_NAME = "Non renseigné";
export const LEGACY_COMMUNE_NAME = "Non renseigné";

/**
 * Retourne les IDs du département et de la commune « génériques » pour une région donnée
 * (chaîne hiérarchique minimale après migration depuis l’enum).
 */
export async function getLegacyGeoIdsForRegion(regionId: string): Promise<{
  departementId: string | null;
  communeId: string | null;
}> {
  const dept = await db.departement.findFirst({
    where: {
      regionId,
      name: LEGACY_DEPARTEMENT_NAME,
      isDeleted: false,
    },
    include: {
      communes: {
        where: { name: LEGACY_COMMUNE_NAME, isDeleted: false },
        take: 1,
      },
    },
  });
  const commune = dept?.communes[0];
  return {
    departementId: dept?.id ?? null,
    communeId: commune?.id ?? null,
  };
}
