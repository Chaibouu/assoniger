import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@prisma/client";
import { getFullTokenPayload } from "@/lib/tokens";
import { getUserById } from "@/data/user";

export async function getBearerAuthenticatedUser(req: NextRequest) {
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

export function requireRoles(userRole: UserRole, allowed: readonly UserRole[]) {
  return allowed.includes(userRole);
}
