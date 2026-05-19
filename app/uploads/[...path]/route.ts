import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { resolveSafeUploadsDiskPath } from "@/lib/upload-paths";
import {
  allowAnonymousAccessToFilename,
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
 * Sert les fichiers rangés sous `uploads/` à la racine du projet sous l’URL `/uploads/...`.
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
  const diskPath = resolveSafeUploadsDiskPath(urlPath);
  if (!diskPath) {
    return new NextResponse(null, { status: 404 });
  }

  const session = await resolveUploadSession(req);
  const allowPublicImage =
    !requireAuthForAllUploads() && allowAnonymousAccessToFilename(lastFilename);

  if (!session.ok && !allowPublicImage) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const buf = await readFile(diskPath);
    const contentType = mimeFromFilename(lastFilename);

    const cacheControl = session.ok
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

    const res = new NextResponse(buf, {
      status: 200,
      headers,
    });

    if (session.ok && session.applyCookies) {
      session.applyCookies(res);
    }

    return res;
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}

export const runtime = "nodejs";
