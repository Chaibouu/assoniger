import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { refreshToken } = await req.json();

    // Rotation : le client API reçoit le nouveau refresh token dans la réponse et doit le conserver
    const result = await refreshSession(refreshToken, { rotate: true });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur lors du rafraîchissement des tokens :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
