import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Référentiel géographique public (lecture seule) pour les formulaires d'inscription.
 * GET ?level=regions | departements&regionId= | communes&departementId=
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");

    if (level === "regions") {
      const regions = await db.region.findMany({
        where: { isDeleted: false },
        select: { id: true, code: true, name: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(
        { regions },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    if (level === "departements") {
      const regionId = searchParams.get("regionId")?.trim();
      if (!regionId) {
        return NextResponse.json({ error: "regionId requis" }, { status: 400 });
      }
      const departements = await db.departement.findMany({
        where: { regionId, isDeleted: false },
        select: { id: true, code: true, name: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(
        { departements },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    if (level === "communes") {
      const departementId = searchParams.get("departementId")?.trim();
      if (!departementId) {
        return NextResponse.json({ error: "departementId requis" }, { status: 400 });
      }
      const communes = await db.commune.findMany({
        where: { departementId, isDeleted: false },
        select: { id: true, code: true, name: true },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(
        { communes },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
      );
    }

    return NextResponse.json(
      { error: "Paramètre level invalide (regions | departements | communes)" },
      { status: 400 }
    );
  } catch (e) {
    console.error("[PUBLIC_GEO]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
