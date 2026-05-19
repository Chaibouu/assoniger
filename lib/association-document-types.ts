import { DocumentType } from "@prisma/client";

export const ASSOCIATION_DOCUMENT_TYPES: DocumentType[] = [
  DocumentType.STATUTES,
  DocumentType.RECEIPT,
  DocumentType.GOVERNING_BOARD,
  DocumentType.TAX_CLEARANCE,
  DocumentType.ANNUAL_REPORT,
  DocumentType.FINANCIAL_REPORT,
  DocumentType.OTHER,
];

export const associationDocumentTypeLabels: Record<DocumentType, string> = {
  STATUTES: "Statuts",
  RECEIPT: "Récépissé / arrêté",
  GOVERNING_BOARD: "Composition du bureau",
  TAX_CLEARANCE: "Quitus fiscal",
  ANNUAL_REPORT: "Rapport d’activités",
  FINANCIAL_REPORT: "Rapport financier",
  OTHER: "Autre document",
};

export function listAssociationDocumentTypesForForm() {
  return ASSOCIATION_DOCUMENT_TYPES.map((value) => ({
    value,
    label: associationDocumentTypeLabels[value],
  }));
}
