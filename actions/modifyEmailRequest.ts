"use server";

import { cookies } from "next/headers";
import { callRoute } from "@/lib/internal-route";
import { refreshSession } from "@/lib/session";
import { POST as changeEmailRequestRoute } from "@/app/api/auth/change-email/request/route";

export const changeEmail = async (body: { newEmail: string }) => {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get("accessToken")?.value;

  // Access token absent (expiré) : on le régénère à partir du refresh token
  if (!accessToken) {
    const refreshToken = cookieStore.get("refreshToken")?.value ?? "";
    const refreshed = await refreshSession(refreshToken);
    if ("error" in refreshed) {
      return { error: "Session expirée, veuillez vous reconnecter." };
    }
    accessToken = refreshed.accessToken;
  }

  const { data } = await callRoute(changeEmailRequestRoute, "/api/auth/change-email/request", {
    body,
    bearer: accessToken,
  });
  return data;
};
