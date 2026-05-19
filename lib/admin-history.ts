import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

type AdminHistoryPayload = {
  userId?: string | null;
  action: string;
  target: string;
  targetId?: string | null;
  status?: "SUCCESS" | "FAILURE";
  metadata?: Record<string, unknown>;
  req?: NextRequest;
};

export async function logAdminHistory(payload: AdminHistoryPayload) {
  try {
    await db.auditLog.create({
      data: {
        userId: payload.userId ?? null,
        action: `${payload.action}:${payload.target}`,
        status: payload.status ?? "SUCCESS",
        ipAddress: payload.req?.headers.get("x-forwarded-for") ?? null,
        userAgent: payload.req?.headers.get("user-agent") ?? null,
        metadata: {
          target: payload.target,
          targetId: payload.targetId ?? null,
          ...(payload.metadata ?? {}),
        },
      },
    });
  } catch (error) {
    console.error("[ADMIN_HISTORY] impossible d'enregistrer l'historique", error);
  }
}
