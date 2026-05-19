import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { upsertCommuneByDepartementAndName } from "@/lib/geo-upsert-restore";
import { getBearerAuthenticatedUser, requireRoles } from "@/lib/api-auth";

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

const PostCommuneSchema = z.object({
  departementId: z.string().min(1),
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
  const departementId = searchParams.get("departementId")?.trim();
  if (!departementId) {
    return NextResponse.json({ error: "departementId requis" }, { status: 400 });
  }

  const communes = await db.commune.findMany({
    where: { departementId, isDeleted: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      departementId: true,
      _count: { select: { associations: true } },
    },
  });

  return NextResponse.json({ communes });
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

  const parsed = PostCommuneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const dept = await db.departement.findFirst({
    where: { id: parsed.data.departementId, isDeleted: false },
  });
  if (!dept) {
    return NextResponse.json({ error: "Département introuvable" }, { status: 400 });
  }

  try {
    const result = await upsertCommuneByDepartementAndName(
      parsed.data.departementId,
      parsed.data.name,
      parsed.data.code
    );
    if (!result.ok) {
      return NextResponse.json(
        { error: "Une commune avec ce nom existe déjà dans ce département" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { commune: result.data, restored: !result.created },
      { status: result.created ? 201 : 200 }
    );
  } catch (e) {
    console.error("[ADMIN_GEO_COMMUNES_POST]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
