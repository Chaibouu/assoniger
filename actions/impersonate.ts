"use server";

import { cookies } from "next/headers";
import { callRoute } from "@/lib/internal-route";
import { POST as startImpersonationRoute } from "@/app/api/admin/impersonate/route";
import { DELETE as endImpersonationRoute } from "@/app/api/admin/impersonate/end/route";

// ─── Démarrer une session d'impersonation ─────────────────────────────────────

export async function startImpersonation(targetUserId: string) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  if (!accessToken) {
    return { error: "Non authentifié" };
  }

  const { ok, data: result } = await callRoute<{
    error?: string;
    impersonationToken: string;
    targetUser: unknown;
  }>(startImpersonationRoute, "/api/admin/impersonate", {
    body: { targetUserId },
    bearer: accessToken,
  });

  if (!ok) {
    return { error: result.error ?? "Impossible de démarrer l'audit" };
  }

  // Poser le cookie httpOnly côté serveur — impossible avec document.cookie en Next.js 15
  cookieStore.set("impersonationToken", result.impersonationToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60, // 15 minutes, cohérent avec l'expiration du JWT
    path: "/",
    sameSite: "lax",
  });

  return {
    success: true,
    targetUser: result.targetUser as {
      id: string;
      name: string | null;
      email: string | null;
      role: string;
    },
  };
}

// ─── Terminer une session d'impersonation ─────────────────────────────────────

export async function endImpersonation() {
  const cookieStore = await cookies();
  const impersonationToken = cookieStore.get("impersonationToken")?.value;

  if (!impersonationToken) {
    return { error: "Aucune session d'audit active" };
  }

  // Supprimer la session en base de données
  await callRoute(endImpersonationRoute, "/api/admin/impersonate/end", {
    method: "DELETE",
    bearer: impersonationToken,
  });

  // Supprimer le cookie côté serveur
  cookieStore.delete("impersonationToken");

  return { success: true };
}
