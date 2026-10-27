/**
 * Appel direct d'un handler de route API depuis une Server Action, sans requête HTTP.
 *
 * Pourquoi : un `fetch` vers sa propre API part du serveur, donc la route voit l'IP du serveur
 * (identique pour tous les visiteurs) — les limites par IP deviennent globales — et l'appel
 * dépend de NEXT_PUBLIC_APP_URL et de la protection des previews Vercel.
 *
 * Ici la requête est construite en mémoire avec l'IP et le user-agent réels du visiteur ;
 * la logique reste uniquement dans la route.
 */

import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { getClientIP } from "@/lib/geo";

type RouteHandler = (req: NextRequest) => Promise<Response>;

export type RouteCallResult<T> = { ok: boolean; status: number; data: T };

export async function callRoute<T = Record<string, unknown>>(
  handler: RouteHandler,
  path: string,
  options: { method?: string; body?: unknown; bearer?: string } = {}
): Promise<RouteCallResult<T>> {
  const incoming = await headers();
  const clientIp = getClientIP({ headers: incoming });

  const forwarded = new Headers({
    "content-type": "application/json",
    "x-forwarded-for": clientIp,
  });
  // Si un header d'IP de confiance est configuré, la route le lit en priorité
  const trustedHeader = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase();
  if (trustedHeader && trustedHeader !== "x-forwarded-for") {
    forwarded.set(trustedHeader, clientIp);
  }
  const userAgent = incoming.get("user-agent");
  if (userAgent) forwarded.set("user-agent", userAgent);
  if (options.bearer) forwarded.set("authorization", `Bearer ${options.bearer}`);

  const req = new NextRequest(new URL(path, "http://internal.local"), {
    method: options.method ?? "POST",
    headers: forwarded,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const res = await handler(req);
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}
