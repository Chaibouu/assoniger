"use server";

import { revalidatePath } from "next/cache";
import type { UserRole } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import {
  upsertCommuneByDepartementAndName,
  upsertDepartementByRegionAndName,
  upsertRegionByCode,
} from "@/lib/geo-upsert-restore";
import { canAccessSettings } from "@/lib/settings-access";
import { AddCommuneSchema } from "@/schemas/communes";
import { AddDepartementSchema } from "@/schemas/departements";
import { AddRegionSchema } from "@/schemas/regions";

export type RegionTableRow = {
  id: string;
  code: string;
  name: string;
  _count: { departements: number; communes: number };
};

export type CreateRegionState =
  | { ok: true }
  | { ok: false; error: string };

/** Liste des régions pour le tableau paramètres (même filtre que la page). */
export async function fetchRegionsTable(): Promise<RegionTableRow[]> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    throw new Error("Non authentifié");
  }
  if (!canAccessSettings(user.role as UserRole)) {
    throw new Error("Accès refusé");
  }

  const rows = await db.region.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      _count: {
        select: {
          departements: { where: { isDeleted: false } },
        },
      },
      departements: {
        where: { isDeleted: false },
        select: {
          _count: {
            select: {
              communes: { where: { isDeleted: false } },
            },
          },
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    _count: {
      departements: r._count.departements,
      communes: r.departements.reduce((acc, d) => acc + d._count.communes, 0),
    },
  }));
}

export async function updateRegion(
  regionId: string,
  formData: FormData
): Promise<CreateRegionState> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    return { ok: false, error: "Non authentifié" };
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }

  const parsed = AddRegionSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg = first.code?.[0] ?? first.name?.[0] ?? "Données invalides";
    return { ok: false, error: msg };
  }

  const existing = await db.region.findFirst({
    where: { id: regionId, isDeleted: false },
  });
  if (!existing) {
    return { ok: false, error: "Région introuvable" };
  }

  const code = parsed.data.code.trim().toUpperCase();
  const name = parsed.data.name.trim();

  try {
    await db.region.update({
      where: { id: regionId },
      data: { code, name },
    });
    revalidatePath("/dashboard/settings/region");
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Ce code région existe déjà" };
    }
    console.error("[updateRegion]", e);
    return { ok: false, error: "Erreur lors de la mise à jour" };
  }
}

export async function deleteRegion(
  id: string
): Promise<{ message?: string; error?: string }> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    return { error: "Non authentifié" };
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { error: "Accès refusé" };
  }

  const region = await db.region.findFirst({
    where: { id, isDeleted: false },
    include: {
      _count: {
        select: {
          departements: true,
          associations: true,
        },
      },
    },
  });
  if (!region) {
    return { error: "Région introuvable" };
  }
  if (region._count.departements > 0 || region._count.associations > 0) {
    return {
      error:
        "Impossible de supprimer : des départements ou associations sont encore liés à cette région.",
    };
  }

  await db.region.update({
    where: { id },
    data: { isDeleted: true },
  });
  revalidatePath("/dashboard/settings/region");
  return { message: "Région supprimée" };
}

export async function createRegion(formData: FormData): Promise<CreateRegionState> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    return { ok: false, error: "Non authentifié" };
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }

  const parsed = AddRegionSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.code?.[0] ?? first.name?.[0] ?? "Données invalides";
    return { ok: false, error: msg };
  }

  const code = parsed.data.code.trim().toUpperCase();
  const name = parsed.data.name.trim();

  try {
    const result = await upsertRegionByCode(code, name);
    if (!result.ok) {
      return { ok: false, error: "Ce code région existe déjà" };
    }
    revalidatePath("/dashboard/settings/region");
    return { ok: true };
  } catch (e) {
    console.error("[createRegion]", e);
    return { ok: false, error: "Erreur lors de la création" };
  }
}

// --- Départements (paramètres / tableau, même contrôle d’accès que les régions) ---

export type RegionOption = {
  id: string;
  code: string;
  name: string;
};

/** Liste des régions pour les sélecteurs (formulaires départements). */
export async function fetchRegionsOptions(): Promise<RegionOption[]> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    throw new Error("Non authentifié");
  }
  if (!canAccessSettings(user.role as UserRole)) {
    throw new Error("Accès refusé");
  }

  return db.region.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    select: { id: true, code: true, name: true },
  });
}

export type DepartementTableRow = {
  id: string;
  regionId: string;
  code: string | null;
  name: string;
  region: { code: string; name: string };
  _count: { communes: number; associations: number };
};

export type CreateDepartementState =
  | { ok: true }
  | { ok: false; error: string };

export async function fetchDepartementsTable(): Promise<DepartementTableRow[]> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    throw new Error("Non authentifié");
  }
  if (!canAccessSettings(user.role as UserRole)) {
    throw new Error("Accès refusé");
  }

  const rows = await db.departement.findMany({
    where: { isDeleted: false },
    orderBy: [{ region: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      regionId: true,
      code: true,
      name: true,
      region: { select: { code: true, name: true } },
      _count: {
        select: {
          communes: { where: { isDeleted: false } },
          associations: { where: { isDeleted: false } },
        },
      },
    },
  });

  return rows.map((d) => ({
    id: d.id,
    regionId: d.regionId,
    code: d.code,
    name: d.name,
    region: d.region,
    _count: {
      communes: d._count.communes,
      associations: d._count.associations,
    },
  }));
}

export async function createDepartement(formData: FormData): Promise<CreateDepartementState> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    return { ok: false, error: "Non authentifié" };
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }

  const parsed = AddDepartementSchema.safeParse({
    regionId: String(formData.get("regionId") ?? ""),
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.regionId?.[0] ??
      first.name?.[0] ??
      first.code?.[0] ??
      "Données invalides";
    return { ok: false, error: msg };
  }

  const region = await db.region.findFirst({
    where: { id: parsed.data.regionId, isDeleted: false },
  });
  if (!region) {
    return { ok: false, error: "Région introuvable" };
  }

  const name = parsed.data.name.trim();
  const codeTrim = parsed.data.code.trim();
  const code = codeTrim === "" ? undefined : codeTrim;

  try {
    const result = await upsertDepartementByRegionAndName(parsed.data.regionId, name, code);
    if (!result.ok) {
      return {
        ok: false,
        error: "Un département avec ce nom existe déjà dans cette région",
      };
    }
    revalidatePath("/dashboard/settings/departement");
    return { ok: true };
  } catch (e) {
    console.error("[createDepartement]", e);
    return { ok: false, error: "Erreur lors de la création" };
  }
}

export async function updateDepartement(
  departementId: string,
  formData: FormData
): Promise<CreateDepartementState> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    return { ok: false, error: "Non authentifié" };
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }

  const parsed = AddDepartementSchema.safeParse({
    regionId: String(formData.get("regionId") ?? ""),
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.regionId?.[0] ??
      first.name?.[0] ??
      first.code?.[0] ??
      "Données invalides";
    return { ok: false, error: msg };
  }

  const existing = await db.departement.findFirst({
    where: { id: departementId, isDeleted: false },
  });
  if (!existing) {
    return { ok: false, error: "Département introuvable" };
  }

  const regionOk = await db.region.findFirst({
    where: { id: parsed.data.regionId, isDeleted: false },
  });
  if (!regionOk) {
    return { ok: false, error: "Région introuvable" };
  }

  const name = parsed.data.name.trim();
  const codeTrim = parsed.data.code.trim();
  const code = codeTrim === "" ? null : codeTrim;

  const duplicate = await db.departement.findFirst({
    where: {
      regionId: parsed.data.regionId,
      name,
      isDeleted: false,
      NOT: { id: departementId },
    },
  });
  if (duplicate) {
    return {
      ok: false,
      error: "Ce nom de département existe déjà dans la région choisie",
    };
  }

  try {
    await db.departement.update({
      where: { id: departementId },
      data: {
        regionId: parsed.data.regionId,
        name,
        code,
      },
    });
    revalidatePath("/dashboard/settings/departement");
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        error: "Ce nom de département existe déjà dans la région choisie",
      };
    }
    console.error("[updateDepartement]", e);
    return { ok: false, error: "Erreur lors de la mise à jour" };
  }
}

export async function deleteDepartement(
  id: string
): Promise<{ message?: string; error?: string }> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    return { error: "Non authentifié" };
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { error: "Accès refusé" };
  }

  const departement = await db.departement.findFirst({
    where: { id, isDeleted: false },
    select: {
      id: true,
      _count: {
        select: {
          communes: { where: { isDeleted: false } },
          associations: { where: { isDeleted: false } },
        },
      },
    },
  });
  if (!departement) {
    return { error: "Département introuvable" };
  }
  if (departement._count.communes > 0 || departement._count.associations > 0) {
    return {
      error:
        "Impossible de supprimer : des communes ou associations sont encore liées à ce département.",
    };
  }

  await db.departement.update({
    where: { id },
    data: { isDeleted: true },
  });
  revalidatePath("/dashboard/settings/departement");
  return { message: "Département supprimé" };
}

// --- Communes ---

export type DepartementOption = {
  id: string;
  name: string;
  code: string | null;
  region: { code: string; name: string };
};

/** Liste des départements pour les sélecteurs (formulaires communes). */
export async function fetchDepartementsOptions(): Promise<DepartementOption[]> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    throw new Error("Non authentifié");
  }
  if (!canAccessSettings(user.role as UserRole)) {
    throw new Error("Accès refusé");
  }

  return db.departement.findMany({
    where: { isDeleted: false },
    orderBy: [{ region: { name: "asc" } }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      region: { select: { code: true, name: true } },
    },
  });
}

export type CommuneTableRow = {
  id: string;
  departementId: string;
  code: string | null;
  name: string;
  departement: {
    name: string;
    region: { code: string; name: string };
  };
  _count: { associations: number };
};

export type CreateCommuneState =
  | { ok: true }
  | { ok: false; error: string };

export async function fetchCommunesTable(): Promise<CommuneTableRow[]> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    throw new Error("Non authentifié");
  }
  if (!canAccessSettings(user.role as UserRole)) {
    throw new Error("Accès refusé");
  }

  const rows = await db.commune.findMany({
    where: { isDeleted: false },
    orderBy: [
      { departement: { region: { name: "asc" } } },
      { departement: { name: "asc" } },
      { name: "asc" },
    ],
    select: {
      id: true,
      departementId: true,
      code: true,
      name: true,
      departement: {
        select: {
          name: true,
          region: { select: { code: true, name: true } },
        },
      },
      _count: {
        select: {
          associations: { where: { isDeleted: false } },
        },
      },
    },
  });

  return rows.map((c) => ({
    id: c.id,
    departementId: c.departementId,
    code: c.code,
    name: c.name,
    departement: c.departement,
    _count: { associations: c._count.associations },
  }));
}

export async function createCommune(formData: FormData): Promise<CreateCommuneState> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    return { ok: false, error: "Non authentifié" };
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }

  const parsed = AddCommuneSchema.safeParse({
    departementId: String(formData.get("departementId") ?? ""),
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.departementId?.[0] ??
      first.name?.[0] ??
      first.code?.[0] ??
      "Données invalides";
    return { ok: false, error: msg };
  }

  const dept = await db.departement.findFirst({
    where: { id: parsed.data.departementId, isDeleted: false },
  });
  if (!dept) {
    return { ok: false, error: "Département introuvable" };
  }

  const name = parsed.data.name.trim();
  const codeTrim = parsed.data.code.trim();
  const code = codeTrim === "" ? undefined : codeTrim;

  try {
    const result = await upsertCommuneByDepartementAndName(
      parsed.data.departementId,
      name,
      code
    );
    if (!result.ok) {
      return {
        ok: false,
        error: "Une commune avec ce nom existe déjà dans ce département",
      };
    }
    revalidatePath("/dashboard/settings/commune");
    revalidatePath("/dashboard/settings/departement");
    revalidatePath("/dashboard/settings/region");
    return { ok: true };
  } catch (e) {
    console.error("[createCommune]", e);
    return { ok: false, error: "Erreur lors de la création" };
  }
}

export async function updateCommune(
  communeId: string,
  formData: FormData
): Promise<CreateCommuneState> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    return { ok: false, error: "Non authentifié" };
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { ok: false, error: "Accès refusé" };
  }

  const parsed = AddCommuneSchema.safeParse({
    departementId: String(formData.get("departementId") ?? ""),
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
  });
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      first.departementId?.[0] ??
      first.name?.[0] ??
      first.code?.[0] ??
      "Données invalides";
    return { ok: false, error: msg };
  }

  const existing = await db.commune.findFirst({
    where: { id: communeId, isDeleted: false },
  });
  if (!existing) {
    return { ok: false, error: "Commune introuvable" };
  }

  const deptOk = await db.departement.findFirst({
    where: { id: parsed.data.departementId, isDeleted: false },
  });
  if (!deptOk) {
    return { ok: false, error: "Département introuvable" };
  }

  const name = parsed.data.name.trim();
  const codeTrim = parsed.data.code.trim();
  const code = codeTrim === "" ? null : codeTrim;

  const duplicate = await db.commune.findFirst({
    where: {
      departementId: parsed.data.departementId,
      name,
      isDeleted: false,
      NOT: { id: communeId },
    },
  });
  if (duplicate) {
    return {
      ok: false,
      error: "Ce nom de commune existe déjà dans le département choisi",
    };
  }

  try {
    await db.commune.update({
      where: { id: communeId },
      data: {
        departementId: parsed.data.departementId,
        name,
        code,
      },
    });
    revalidatePath("/dashboard/settings/commune");
    revalidatePath("/dashboard/settings/departement");
    revalidatePath("/dashboard/settings/region");
    return { ok: true };
  } catch (e) {
    if (e instanceof PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false,
        error: "Ce nom de commune existe déjà dans le département choisi",
      };
    }
    console.error("[updateCommune]", e);
    return { ok: false, error: "Erreur lors de la mise à jour" };
  }
}

export async function deleteCommune(
  id: string
): Promise<{ message?: string; error?: string }> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    return { error: "Non authentifié" };
  }
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    return { error: "Accès refusé" };
  }

  const commune = await db.commune.findFirst({
    where: { id, isDeleted: false },
    select: {
      id: true,
      _count: {
        select: {
          associations: { where: { isDeleted: false } },
        },
      },
    },
  });
  if (!commune) {
    return { error: "Commune introuvable" };
  }
  if (commune._count.associations > 0) {
    return {
      error:
        "Impossible de supprimer : des associations sont encore liées à cette commune.",
    };
  }

  await db.commune.update({
    where: { id },
    data: { isDeleted: true },
  });
  revalidatePath("/dashboard/settings/commune");
  revalidatePath("/dashboard/settings/departement");
  revalidatePath("/dashboard/settings/region");
  return { message: "Commune supprimée" };
}
