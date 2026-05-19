/**
 * Codes régions Niger — alignés sur les lignes `Region.code` en base (référentiel).
 */
export const NIGER_REGION_CODES = [
  "NIAMEY",
  "ZINDER",
  "MARADI",
  "TAHOUA",
  "AGADEZ",
  "DIFFA",
  "TILLABERI",
  "DOSSO",
] as const;

export type NigerRegionCode = (typeof NIGER_REGION_CODES)[number];

export const REGION_LABELS: Record<NigerRegionCode, string> = {
  NIAMEY: "Niamey",
  ZINDER: "Zinder",
  MARADI: "Maradi",
  TAHOUA: "Tahoua",
  AGADEZ: "Agadez",
  DIFFA: "Diffa",
  TILLABERI: "Tillabéri",
  DOSSO: "Dosso",
};
