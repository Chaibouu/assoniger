import { NextRequest, NextResponse } from "next/server";
import { toUploadStorageKey } from "@/lib/upload-paths";
import { getObject } from "@/lib/storage";
import {
  allowAnonymousAccessToFilename,
  canUserAccessUpload,
  resolveUploadSession,
} from "@/lib/upload-auth";

function mimeFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return map[ext] ?? "application/octet-stream";
}

/** Si true, même les images exigent une session (désactive les logos sur pages publiques brutes /uploads). */
function requireAuthForAllUploads(): boolean {
  return process.env.UPLOADS_REQUIRE_AUTH_ALL === "true";
}

/**
 * Sert les fichiers stockés sur Cloudflare R2 (clés `uploads/...`) sous l’URL `/uploads/...`.
 * Session obligatoire sauf images jpg/png/gif/webp (logos publics), sauf si UPLOADS_REQUIRE_AUTH_ALL=true.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  if (!segments?.length) {
    return new NextResponse(null, { status: 404 });
  }

  const decodedSegments: string[] = [];
  for (const seg of segments) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(seg);
    } catch {
      return new NextResponse(null, { status: 400 });
    }
    if (
      decoded === ".." ||
      decoded === "." ||
      decoded.includes("/") ||
      decoded.includes("\\")
    ) {
      return new NextResponse(null, { status: 404 });
    }
    decodedSegments.push(decoded);
  }

  const lastFilename = decodedSegments[decodedSegments.length - 1] ?? "";
  const urlPath = `/uploads/${decodedSegments.join("/")}`;
  const storageKey = toUploadStorageKey(urlPath);
  if (!storageKey) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await resolveUploadSession(req);
  const allowPublicImage =
    !requireAuthForAllUploads() && allowAnonymousAccessToFilename(lastFilename);

  // Une session seule ne suffit pas : l'utilisateur doit avoir les droits sur ce fichier.
  const authorized = session.ok && (await canUserAccessUpload(session.userId, decodedSegments));

  if (!authorized && !allowPublicImage) {
    return new NextResponse(null, { status: session.ok ? 403 : 401 });
  }

  let buf: Uint8Array | null;
  try {
    buf = await getObject(storageKey);
  } catch (error) {
    console.error("[uploads] Erreur de lecture R2 :", error);
    return new NextResponse(null, { status: 500 });
  }
  if (!buf) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = mimeFromFilename(lastFilename);

  const cacheControl = authorized
    ? "private, no-store"
    : "public, max-age=3600, s-maxage=3600";

  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": cacheControl,
  };
  if (contentType === "application/pdf") {
    headers["Content-Disposition"] = "inline";
    headers["X-Content-Type-Options"] = "nosniff";
  }

  const res = new NextResponse(Buffer.from(buf), {
    status: 200,
    headers,
  });

  if (session.ok && session.applyCookies) {
    session.applyCookies(res);
  }

  return res;
}

export const runtime = "nodejs";
