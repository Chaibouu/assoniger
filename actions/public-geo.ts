"use server";

import { db } from "@/lib/db";

export type PublicGeoOption = {
  id: string;
  code: string | null;
  name: string;
};

/** Lecture publique — même logique que GET /api/public/geo (sans passer par HTTP). */
export async function fetchPublicRegions(): Promise<PublicGeoOption[]> {
  return db.region.findMany({
    where: { isDeleted: false },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function fetchPublicDepartements(regionId: string): Promise<PublicGeoOption[]> {
  const id = regionId?.trim();
  if (!id) return [];
  return db.departement.findMany({
    where: { regionId: id, isDeleted: false },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function fetchPublicCommunes(departementId: string): Promise<PublicGeoOption[]> {
  const id = departementId?.trim();
  if (!id) return [];
  return db.commune.findMany({
    where: { departementId: id, isDeleted: false },
    select: { id: true, code: true, name: true },
    orderBy: { name: "asc" },
  });
}
