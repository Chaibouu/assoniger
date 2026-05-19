import { db } from "@/lib/db";

type Ok<T> = { ok: true; created: boolean; data: T };
type Duplicate = { ok: false; reason: "duplicate_active" };
export type GeoUpsertResult<T> = Ok<T> | Duplicate;

/**
 * Crée une région ou réactive (`isDeleted: false`) une ligne supprimée avec le même `code`.
 */
export async function upsertRegionByCode(
  code: string,
  name: string
): Promise<GeoUpsertResult<{ id: string; code: string; name: string }>> {
  const active = await db.region.findFirst({
    where: { code, isDeleted: false },
  });
  if (active) return { ok: false, reason: "duplicate_active" };

  const deleted = await db.region.findFirst({
    where: { code, isDeleted: true },
  });
  if (deleted) {
    const data = await db.region.update({
      where: { id: deleted.id },
      data: { name, isDeleted: false },
      select: { id: true, code: true, name: true },
    });
    return { ok: true, created: false, data };
  }

  const data = await db.region.create({
    data: { code, name },
    select: { id: true, code: true, name: true },
  });
  return { ok: true, created: true, data };
}

/**
 * Crée un département ou réactive la ligne supprimée avec la même paire `regionId` + `name`.
 */
export async function upsertDepartementByRegionAndName(
  regionId: string,
  name: string,
  code: string | null | undefined
): Promise<
  GeoUpsertResult<{ id: string; code: string | null; name: string; regionId: string }>
> {
  const active = await db.departement.findFirst({
    where: { regionId, name, isDeleted: false },
  });
  if (active) return { ok: false, reason: "duplicate_active" };

  const deleted = await db.departement.findFirst({
    where: { regionId, name, isDeleted: true },
  });
  if (deleted) {
    const data = await db.departement.update({
      where: { id: deleted.id },
      data: {
        isDeleted: false,
        ...(code !== undefined && code !== null ? { code } : {}),
      },
      select: { id: true, code: true, name: true, regionId: true },
    });
    return { ok: true, created: false, data };
  }

  const data = await db.departement.create({
    data: {
      regionId,
      name,
      code: code ?? undefined,
    },
    select: { id: true, code: true, name: true, regionId: true },
  });
  return { ok: true, created: true, data };
}

/**
 * Crée une commune ou réactive la ligne supprimée avec la même paire `departementId` + `name`.
 */
export async function upsertCommuneByDepartementAndName(
  departementId: string,
  name: string,
  code: string | null | undefined
): Promise<
  GeoUpsertResult<{ id: string; code: string | null; name: string; departementId: string }>
> {
  const active = await db.commune.findFirst({
    where: { departementId, name, isDeleted: false },
  });
  if (active) return { ok: false, reason: "duplicate_active" };

  const deleted = await db.commune.findFirst({
    where: { departementId, name, isDeleted: true },
  });
  if (deleted) {
    const data = await db.commune.update({
      where: { id: deleted.id },
      data: {
        isDeleted: false,
        ...(code !== undefined && code !== null ? { code } : {}),
      },
      select: { id: true, code: true, name: true, departementId: true },
    });
    return { ok: true, created: false, data };
  }

  const data = await db.commune.create({
    data: {
      departementId,
      name,
      code: code ?? undefined,
    },
    select: { id: true, code: true, name: true, departementId: true },
  });
  return { ok: true, created: true, data };
}
