import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { upsertDepartementByRegionAndName } from "@/lib/geo-upsert-restore";
import { getBearerAuthenticatedUser, requireRoles } from "@/lib/api-auth";

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

const PostDepartementSchema = z.object({
  regionId: z.string().min(1),
  name: z.string().min(2).max(128).trim(),
  code: z.string().max(32).trim().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const auth = await getBearerAuthenticatedUser(req);
  if ("error" in auth) return auth.error;
  if (!requireRoles(auth.user.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const regionId = searchParams.get("regionId")?.trim();
  if (!regionId) {
    return NextResponse.json({ error: "regionId requis" }, { status: 400 });
  }

  const departements = await db.departement.findMany({
    where: { regionId, isDeleted: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      regionId: true,
      _count: { select: { communes: true, associations: true } },
    },
  });

  return NextResponse.json({ departements });
}

export async function POST(req: NextRequest) {
  const auth = await getBearerAuthenticatedUser(req);
  if ("error" in auth) return auth.error;
  if (!requireRoles(auth.user.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const parsed = PostDepartementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const region = await db.region.findFirst({
    where: { id: parsed.data.regionId, isDeleted: false },
  });
  if (!region) {
    return NextResponse.json({ error: "Région introuvable" }, { status: 400 });
  }

  try {
    const result = await upsertDepartementByRegionAndName(
      parsed.data.regionId,
      parsed.data.name,
      parsed.data.code
    );
    if (!result.ok) {
      return NextResponse.json(
        { error: "Un département avec ce nom existe déjà dans cette région" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { departement: result.data, restored: !result.created },
      { status: result.created ? 201 : 200 }
    );
  } catch (e) {
    console.error("[ADMIN_GEO_DEPTS_POST]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
