import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { upsertRegionByCode } from "@/lib/geo-upsert-restore";
import { getBearerAuthenticatedUser, requireRoles } from "@/lib/api-auth";

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

const PostRegionSchema = z.object({
  code: z.string().min(2).max(64).transform((s) => s.trim().toUpperCase()),
  name: z.string().min(2).max(128).trim(),
});

export async function GET(req: NextRequest) {
  const auth = await getBearerAuthenticatedUser(req);
  if ("error" in auth) return auth.error;
  if (!requireRoles(auth.user.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const regions = await db.region.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { departements: true, associations: true } },
    },
  });

  return NextResponse.json({ regions });
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

  const parsed = PostRegionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await upsertRegionByCode(parsed.data.code, parsed.data.name);
    if (!result.ok) {
      return NextResponse.json({ error: "Ce code région existe déjà" }, { status: 409 });
    }
    return NextResponse.json(
      { region: result.data, restored: !result.created },
      { status: result.created ? 201 : 200 }
    );
  } catch (e) {
    console.error("[ADMIN_GEO_REGIONS_POST]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
