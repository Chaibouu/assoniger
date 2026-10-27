/** Demande d’adhésion en attente (ne pas confondre avec un poste au bureau). */
export const ASSOCIATION_MEMBER_PENDING_POSITION = "MEMBER_PENDING" as const;

/** Membre simple / adhérent (hors bureau exécutif). */
export const ASSOCIATION_MEMBER_SIMPLE_POSITION = "MEMBER" as const;

/**
 * true si le poste saisi pour le bureau est une valeur réservée (MEMBER / MEMBER_PENDING).
 * Les demandes d'adhésion ne doivent être créées que par l'inscription publique : sinon une
 * association pourrait fabriquer une « demande » au nom d'un compte existant puis l'approuver.
 */
export function isReservedMemberPosition(position: string): boolean {
  const normalized = position.trim().toUpperCase();
  return (
    normalized === ASSOCIATION_MEMBER_SIMPLE_POSITION ||
    normalized === ASSOCIATION_MEMBER_PENDING_POSITION
  );
}

/** Poste au bureau exécutif : toute valeur autre que MEMBER / MEMBER_PENDING. */
export function isExecutiveBoardMemberPosition(position: string): boolean {
  return (
    position !== ASSOCIATION_MEMBER_SIMPLE_POSITION &&
    position !== ASSOCIATION_MEMBER_PENDING_POSITION
  );
}
