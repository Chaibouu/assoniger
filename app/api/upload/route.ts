import { NextRequest, NextResponse } from "next/server";
import { uploadFromFormData, validateFile } from "@/lib/upload";
import { handleApiError, ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getBearerAuthenticatedUser } from "@/lib/api-auth";
import { userUploadRelative } from "@/lib/upload-paths";

/**
 * API route pour uploader des fichiers (utilisateur authentifié uniquement)
 * POST /api/upload
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getBearerAuthenticatedUser(req);
    if ("error" in auth) return auth.error;
    if (!auth.user.isActive) {
      return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new ValidationError("Aucun fichier fourni");
    }

    // Options d'upload (peuvent être personnalisées selon vos besoins)
    const uploadOptions = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
      ],
      destination: userUploadRelative(auth.user.id),
    };

    // Valider le fichier
    const validation = validateFile(file, uploadOptions);
    if (!validation.valid) {
      throw new ValidationError(validation.error || "Fichier invalide");
    }

    // Uploader le fichier
    const result = await uploadFromFormData(formData, "file", uploadOptions);

    logger.info({ filename: result.filename, size: result.size, mimetype: result.mimetype }, "File uploaded successfully");

    return NextResponse.json({
      success: true,
      file: {
        filename: result.filename,
        path: result.path,
        size: result.size,
        mimetype: result.mimetype,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "File upload failed");
    return handleApiError(error);
  }
}

// Désactiver le body parsing par défaut pour gérer FormData
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
