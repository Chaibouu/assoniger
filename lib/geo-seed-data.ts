import type { NigerRegionCode } from "@/lib/geo-labels";

/** Départements et communes d’exemple (chef-lieux / subdivisions usuelles) — à enrichir via CRUD admin. */
export type GeoSeedDepartement = {
  name: string;
  /** Communes rattachées au département */
  communes: string[];
};

export type GeoSeedRegion = {
  code: NigerRegionCode;
  departements: GeoSeedDepartement[];
};

export const GEO_SEED_TREE: GeoSeedRegion[] = [
  {
    code: "NIAMEY",
    departements: [
      {
        name: "Niamey",
        communes: ["Niamey I", "Niamey II", "Niamey III", "Niamey IV", "Niamey V"],
      },
    ],
  },
  {
    code: "AGADEZ",
    departements: [
      { name: "Agadez", communes: ["Agadez"] },
      { name: "Arlit", communes: ["Arlit"] },
      { name: "Bilma", communes: ["Bilma"] },
      { name: "Iférouane", communes: ["Iférouane"] },
    ],
  },
  {
    code: "DIFFA",
    departements: [
      { name: "Diffa", communes: ["Diffa"] },
      { name: "Maïné-Soroa", communes: ["Maïné-Soroa"] },
      { name: "N'Guigmi", communes: ["N'Guigmi"] },
      { name: "Bosso", communes: ["Bosso"] },
    ],
  },
  {
    code: "DOSSO",
    departements: [
      { name: "Dosso", communes: ["Dosso"] },
      { name: "Dogondoutchi", communes: ["Dogondoutchi"] },
      { name: "Gaya", communes: ["Gaya"] },
      { name: "Loga", communes: ["Loga"] },
      { name: "Boboye", communes: ["Boboye"] },
    ],
  },
  {
    code: "MARADI",
    departements: [
      { name: "Maradi", communes: ["Maradi"] },
      { name: "Guidan Roumdji", communes: ["Guidan Roumdji"] },
      { name: "Madarounfa", communes: ["Madarounfa"] },
      { name: "Mayahi", communes: ["Mayahi"] },
      { name: "Tessaoua", communes: ["Tessaoua"] },
    ],
  },
  {
    code: "TAHOUA",
    departements: [
      { name: "Tahoua", communes: ["Tahoua"] },
      { name: "Birni N'Konni", communes: ["Birni N'Konni"] },
      { name: "Illela", communes: ["Illela"] },
      { name: "Keita", communes: ["Keita"] },
      { name: "Madaoua", communes: ["Madaoua"] },
    ],
  },
  {
    code: "TILLABERI",
    departements: [
      { name: "Tillabéri", communes: ["Tillabéri"] },
      { name: "Ayorou", communes: ["Ayorou"] },
      { name: "Filingué", communes: ["Filingué"] },
      { name: "Kollo", communes: ["Kollo"] },
      { name: "Ouallam", communes: ["Ouallam"] },
      { name: "Say", communes: ["Say"] },
    ],
  },
  {
    code: "ZINDER",
    departements: [
      { name: "Zinder", communes: ["Zinder"] },
      { name: "Mirriah", communes: ["Mirriah"] },
      { name: "Magaria", communes: ["Magaria"] },
      { name: "Kantché", communes: ["Kantché"] },
      { name: "Tanout", communes: ["Tanout"] },
      { name: "Matameye", communes: ["Matameye"] },
    ],
  },
];
