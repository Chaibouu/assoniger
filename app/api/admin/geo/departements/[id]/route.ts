import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { getBearerAuthenticatedUser, requireRoles } from "@/lib/api-auth";

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN] as const;

const PatchDepartementSchema = z.object({
  name: z.string().min(2).max(128).trim().optional(),
  code: z.string().max(32).trim().nullable().optional(),
  isDeleted: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getBearerAuthenticatedUser(req);
  if ("error" in auth) return auth.error;
  if (!requireRoles(auth.user.role, ADMIN_ROLES)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { id } = await params;
  const departement = await db.departement.findFirst({
    where: { id },
    select: {
      id: true,
      code: true,
      name: true,
      regionId: true,
      isDeleted: true,
      region: { select: { id: true, code: true, name: true } },
      communes: {
        where: { isDeleted: false },
        orderBy: { name: "asc" },
        select: { id: true, code: true, name: true },
      },
    },
  });

  if (!departement) {
    return NextResponse.json({ error: "Département introuvable" }, { status: 404 });
  }

  return NextResponse.json({ departement });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const parsed = PatchDepartementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { id } = await params;
  try {
    const departement = await db.departement.update({
      where: { id },
      data: parsed.data,
      select: { id: true, code: true, name: true, regionId: true, isDeleted: true },
    });
    return NextResponse.json({ departement });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Ce nom de département existe déjà dans la région" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Département introuvable" }, { status: 404 });
  }
}
