"use server";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import { resolveSessionUser } from "@/lib/session";
import { SESSION_HEADER, decodeSessionHeader } from "@/lib/session-header";

type ResolvedSession = Awaited<ReturnType<typeof resolveSessionUser>>;

/**
 * Identité de la requête courante (Server Components, Server Actions). Voir `resolveSessionUser`.
 * Le middleware a déjà résolu la session pour cette requête : on réutilise son résultat (signé)
 * plutôt que de réinterroger la base ; repli sur les cookies s'il est absent ou invalide.
 */
export const getUser = cache(async (): Promise<ResolvedSession> => {
  const fromMiddleware = decodeSessionHeader<ResolvedSession>((await headers()).get(SESSION_HEADER));
  if (fromMiddleware) return fromMiddleware;

  const cookieStore = await cookies();
  return resolveSessionUser({
    accessToken: cookieStore.get("accessToken")?.value,
    refreshToken: cookieStore.get("refreshToken")?.value,
    impersonationToken: cookieStore.get("impersonationToken")?.value,
  });
});
