/** Demande d’adhésion en attente (ne pas confondre avec un poste au bureau). */
export const ASSOCIATION_MEMBER_PENDING_POSITION = "MEMBER_PENDING" as const;

/** Membre simple / adhérent (hors bureau exécutif). */
export const ASSOCIATION_MEMBER_SIMPLE_POSITION = "MEMBER" as const;

/** Poste au bureau exécutif : toute valeur autre que MEMBER / MEMBER_PENDING. */
export function isExecutiveBoardMemberPosition(position: string): boolean {
  return (
    position !== ASSOCIATION_MEMBER_SIMPLE_POSITION &&
    position !== ASSOCIATION_MEMBER_PENDING_POSITION
  );
}
