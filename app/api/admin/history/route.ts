import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getFullTokenPayload } from "@/lib/tokens";
import { getUserById } from "@/data/user";

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return { error: NextResponse.json({ error: "Authentification requise" }, { status: 401 }) };
  }

  const payload = getFullTokenPayload(token);
  if (!payload?.userId) {
    return {
      error: NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 }),
    };
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return { error: NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 }) };
  }

  return { user };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req);
    if ("error" in auth) return auth.error;

    const { user } = auth;
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé — rôle ADMIN ou SUPER_ADMIN requis" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "20"), 1), 100);
    const action = (searchParams.get("action") ?? "").trim();

    const where: Record<string, unknown> = {
      isDeleted: false,
    };

    if (action) {
      where.action = { contains: action, mode: "insensitive" };
    }

    const [total, history] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique admin :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
