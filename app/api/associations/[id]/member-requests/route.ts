import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getFullTokenPayload } from "@/lib/tokens";
import { getUserById } from "@/data/user";

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return {
      error: NextResponse.json({ error: "Authentification requise" }, { status: 401 }),
    };
  }

  const payload = getFullTokenPayload(token);
  if (!payload?.userId) {
    return {
      error: NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 }),
    };
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 }),
    };
  }

  return { user };
}

async function canAccessAssociation(associationId: string, userId: string, role: string) {
  const association = await db.association.findUnique({
    where: { id: associationId, isDeleted: false },
    select: { id: true, userId: true },
  });

  if (!association) {
    return { error: NextResponse.json({ error: "Association introuvable" }, { status: 404 }) };
  }

  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && association.userId !== userId) {
    return {
      error: NextResponse.json(
        { error: "Vous ne pouvez gérer que les demandes de votre association" },
        { status: 403 }
      ),
    };
  }

  return { association };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    if ("error" in auth) return auth.error;

    const { user } = auth;
    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "ASSOCIATION"
    ) {
      return NextResponse.json(
        { error: "Accès refusé — rôle ADMIN ou ASSOCIATION requis" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const access = await canAccessAssociation(id, user.id, user.role);
    if ("error" in access) return access.error;

    const requests = await db.associationMember.findMany({
      where: {
        associationId: id,
        isDeleted: false,
        position: "MEMBER_PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes membre :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
