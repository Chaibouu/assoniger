/**
 * Healthcheck endpoint — GET /api/health
 *
 * Vérifie l'état des services critiques.
 * Utilisé par : Nginx upstream checks, PM2, UptimeRobot, etc.
 *
 * Réponses :
 *   200 { status: "ok", ... }       → tout est opérationnel
 *   503 { status: "degraded", ... } → au moins un service en erreur
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ServiceStatus {
  status: "ok" | "error" | "not_configured";
  latencyMs?: number;
}

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: "ok", latencyMs: Date.now() - start };
  } catch (err) {
    // Détail en logs serveur uniquement : le message Prisma peut contenir l'hôte de la base
    console.error("[health] base de données :", err);
    return { status: "error", latencyMs: Date.now() - start };
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const start = Date.now();
  // Sans REDIS_URL, ioredis tenterait localhost : Redis est optionnel (cache et rate limit en repli)
  if (!process.env.REDIS_URL) return { status: "not_configured" };
  try {
    // Import dynamique — ioredis requiert Node.js runtime
    const { redis } = await import("@/lib/redis");
    const pong = await redis.ping();
    return {
      status: pong === "PONG" ? "ok" : "error",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    console.error("[health] redis :", err);
    return { status: "error", latencyMs: Date.now() - start };
  }
}

export async function GET() {
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  const allOk = database.status === "ok" && redis.status !== "error";
  const httpStatus = allOk ? 200 : 503;

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      services: { database, redis },
    },
    { status: httpStatus }
  );
}
