/**
 * Arborescence disque (relative à la racine du projet, sans `public/`) pour les fichiers
 * d’une association. Toujours indexée par l’id Prisma de l’association (cuid), jamais par un slug.
 *
 * Convention :
 * - `uploads/associations/{associationId}/registration/` — logo et arrêté déposés à l’inscription publique
 * - `uploads/associations/{associationId}/documents/` — documents ajoutés depuis le tableau de bord
 *
 * Les anciennes URL (`…/associations/{slug}-{id}/…`) restent valides tant que les fichiers
 * n’ont pas été déplacés ; seules les **nouvelles** écritures suivent cette convention.
 */

export function associationUploadRootRelative(associationId: string): string {
  return `uploads/associations/${associationId}`;
}

/** Dossier des fichiers d’inscription (logo, récépissé PDF). */
export function associationRegistrationUploadRelative(associationId: string): string {
  return `${associationUploadRootRelative(associationId)}/registration`;
}

/** Dossier des documents ajoutés par l’association (hors inscription). */
export function associationDocumentsUploadRelative(associationId: string): string {
  return `${associationUploadRootRelative(associationId)}/documents`;
}
