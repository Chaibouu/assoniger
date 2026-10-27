import { NextResponse } from "next/server";
import { AssociationStatus } from "@prisma/client";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const associations = await db.association.findMany({
      where: {
        isDeleted: false,
        // Mêmes statuts que ceux acceptés pour une demande d'adhésion (register)
        status: {
          in: [AssociationStatus.ACTIVE, AssociationStatus.VERIFIED],
        },
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { acronym: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        acronym: true,
        region: { select: { code: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      associations: associations.map((a) => ({
        id: a.id,
        name: a.name,
        acronym: a.acronym,
        regionLabel: a.region?.name ?? a.region?.code ?? "",
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la recherche d'associations :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
