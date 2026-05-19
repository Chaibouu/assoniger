function apiBaseUrl(origin?: string): string | null {
  const base = (origin ?? process.env.NEXT_PUBLIC_APP_URL)?.replace(/\/+$/, "");
  return base || null;
}

export const refreshUserToken = async (
  refreshToken: string,
  origin?: string
) => {
  const base = apiBaseUrl(origin);
  if (!base) {
    return { error: "URL application non configurée (NEXT_PUBLIC_APP_URL ou origine requête)" };
  }
  const refreshResponse = await fetch(`${base}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshResponse.ok) {
    return { error: "Impossible de rafraîchir le token" };
  }
  return await refreshResponse.json();
};

export const getUserInfo = async (accessToken: string) => {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const userResponse = await fetch(`${origin}/api/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    return {
      error:
        "Impossible de récupérer les informations de l'utilisateur après rafraîchissement",
    };
  }
  return await userResponse.json();
};
