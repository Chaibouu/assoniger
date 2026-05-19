"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DocumentType } from "@prisma/client";
import { assertAssociationManagementAccess } from "@/lib/association-self-access";
import { ASSOCIATION_MEMBER_SIMPLE_POSITION } from "@/lib/association-member-kind";
import { ASSOCIATION_DOCUMENT_TYPES } from "@/lib/association-document-types";
import { db } from "@/lib/db";
import { associationDocumentsUploadRelative } from "@/lib/association-upload-paths";
import {
  adhesionAssociationPath,
  documentsAssociationPath,
  membresAssociationPath,
  revalidateAssociationWorkspaceSegment,
} from "@/lib/association-workspace-paths";
import { deleteUploadedFile, uploadFile } from "@/lib/upload";

function membresPath(associationId: string, query?: Record<string, string>) {
  const q = query ? new URLSearchParams(query).toString() : "";
  return `${membresAssociationPath(associationId)}${q ? `?${q}` : ""}`;
}

function demandesPath(associationId: string, query?: Record<string, string>) {
  const q = query ? new URLSearchParams(query).toString() : "";
  return `${adhesionAssociationPath(associationId)}${q ? `?${q}` : ""}`;
}

function documentsPath(associationId: string, query?: Record<string, string>) {
  const q = query ? new URLSearchParams(query).toString() : "";
  return `${documentsAssociationPath(associationId)}${q ? `?${q}` : ""}`;
}

export async function addAssociationMemberAction(formData: FormData) {
  const associationId = String(formData.get("associationId") ?? "").trim();
  if (!associationId) redirect("/dashboard/profile");

  await assertAssociationManagementAccess(associationId);

  const fullName = String(formData.get("fullName") ?? "").trim();
  const memberKindRaw = String(formData.get("memberKind") ?? "executive").trim();
  const memberKind = memberKindRaw === "simple" ? "simple" : "executive";
  const executivePost = String(formData.get("executivePost") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const emailRaw = String(formData.get("email") ?? "").trim();
  const email = emailRaw ? emailRaw : null;
  const isPrimary = memberKind === "executive" && formData.get("isPrimary") === "on";

  const position =
    memberKind === "simple" ? ASSOCIATION_MEMBER_SIMPLE_POSITION : executivePost;

  if (fullName.length < 2) {
    redirect(await membresPath(associationId, { err: "champs" }));
  }
  if (memberKind === "executive" && position.length < 2) {
    redirect(await membresPath(associationId, { err: "poste" }));
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(await membresPath(associationId, { err: "email" }));
  }

  await db.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.associationMember.updateMany({
        where: { associationId, isDeleted: false },
        data: { isPrimary: false },
      });
    }
    await tx.associationMember.create({
      data: {
        associationId,
        fullName,
        position,
        phone,
        email,
        isPrimary,
      },
    });
  });

  revalidateAssociationWorkspaceSegment(associationId, "membres");
  revalidatePath(`/dashboard/profile`);
  redirect(await membresPath(associationId, { ok: "1" }));
}

export async function removeAssociationMemberAction(formData: FormData) {
  const associationId = String(formData.get("associationId") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!associationId || !memberId) redirect("/dashboard/profile");

  await assertAssociationManagementAccess(associationId);

  const row = await db.associationMember.findFirst({
    where: { id: memberId, associationId, isDeleted: false },
  });
  if (!row) redirect(await membresPath(associationId, { err: "notfound" }));
  if (row.position === "MEMBER_PENDING") {
    redirect(await membresPath(associationId, { err: "pending" }));
  }

  await db.associationMember.update({
    where: { id: memberId },
    data: { isDeleted: true },
  });

  revalidateAssociationWorkspaceSegment(associationId, "membres");
  revalidatePath(`/dashboard/profile`);
  redirect(await membresPath(associationId, { ok: "1" }));
}

function optPhotoUrl(v: string | null): string | null {
  if (!v || !v.trim()) return null;
  try {
    // eslint-disable-next-line no-new -- validation only
    new URL(v);
    return v.trim();
  } catch {
    return null;
  }
}

export async function updateAssociationMemberAction(formData: FormData) {
  const associationId = String(formData.get("associationId") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!associationId || !memberId) redirect("/dashboard/profile");

  await assertAssociationManagementAccess(associationId);

  const existing = await db.associationMember.findFirst({
    where: { id: memberId, associationId, isDeleted: false },
  });
  if (!existing) redirect(await membresPath(associationId, { err: "notfound" }));
  if (existing.position === "MEMBER_PENDING") {
    redirect(await membresPath(associationId, { err: "pending" }));
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const memberKindRaw = String(formData.get("memberKind") ?? "executive").trim();
  const memberKind = memberKindRaw === "simple" ? "simple" : "executive";
  const executivePost = String(formData.get("executivePost") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const emailRaw = String(formData.get("email") ?? "").trim();
  const email = emailRaw ? emailRaw : null;
  const isPrimary = memberKind === "executive" && formData.get("isPrimary") === "on";
  const photoUrlRaw = String(formData.get("photoUrl") ?? "").trim();
  const photoUrl = optPhotoUrl(photoUrlRaw || null);

  const position =
    memberKind === "simple" ? ASSOCIATION_MEMBER_SIMPLE_POSITION : executivePost;

  if (fullName.length < 2) {
    redirect(await membresPath(associationId, { err: "champs" }));
  }
  if (memberKind === "executive" && position.length < 2) {
    redirect(await membresPath(associationId, { err: "poste" }));
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect(await membresPath(associationId, { err: "email" }));
  }

  await db.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.associationMember.updateMany({
        where: { associationId, isDeleted: false, NOT: { id: memberId } },
        data: { isPrimary: false },
      });
    }
    await tx.associationMember.update({
      where: { id: memberId },
      data: {
        fullName,
        position,
        phone,
        email,
        photoUrl,
        isPrimary: memberKind === "executive" ? isPrimary : false,
      },
    });
  });

  revalidateAssociationWorkspaceSegment(associationId, "membres");
  revalidatePath(`/dashboard/profile`);
  redirect(await membresPath(associationId, { ok: "1" }));
}

export async function approveJoinRequestAction(formData: FormData) {
  const associationId = String(formData.get("associationId") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!associationId || !memberId) redirect("/dashboard/profile");

  await assertAssociationManagementAccess(associationId);

  const memberRequest = await db.associationMember.findFirst({
    where: {
      id: memberId,
      associationId,
      isDeleted: false,
      position: "MEMBER_PENDING",
    },
  });
  if (!memberRequest) redirect(await demandesPath(associationId, { err: "notfound" }));

  await db.$transaction(async (tx) => {
    const member = await tx.associationMember.update({
      where: { id: memberId },
      data: { position: ASSOCIATION_MEMBER_SIMPLE_POSITION },
    });
    if (member.email) {
      await tx.user.updateMany({
        where: { email: member.email },
        data: { isActive: true },
      });
    }
    await tx.activityLog.create({
      data: {
        associationId,
        action: "JOIN_REQUEST_APPROVED",
        entity: "AssociationMembership",
        entityId: memberId,
        newValues: { status: "APPROVED", memberEmail: member.email },
      },
    });
  });

  revalidateAssociationWorkspaceSegment(associationId, "demandes-adhesion");
  revalidateAssociationWorkspaceSegment(associationId, "membres");
  revalidatePath(`/dashboard/profile`);
  redirect(await demandesPath(associationId, { ok: "1" }));
}

export async function rejectJoinRequestAction(formData: FormData) {
  const associationId = String(formData.get("associationId") ?? "").trim();
  const memberId = String(formData.get("memberId") ?? "").trim();
  if (!associationId || !memberId) redirect("/dashboard/profile");

  await assertAssociationManagementAccess(associationId);

  const memberRequest = await db.associationMember.findFirst({
    where: {
      id: memberId,
      associationId,
      isDeleted: false,
      position: "MEMBER_PENDING",
    },
  });
  if (!memberRequest) redirect(await demandesPath(associationId, { err: "notfound" }));

  await db.$transaction(async (tx) => {
    await tx.associationMember.update({
      where: { id: memberId },
      data: { isDeleted: true },
    });
    await tx.activityLog.create({
      data: {
        associationId,
        action: "JOIN_REQUEST_REJECTED",
        entity: "AssociationMembership",
        entityId: memberId,
        newValues: { status: "REJECTED", memberEmail: memberRequest.email },
      },
    });
  });

  revalidateAssociationWorkspaceSegment(associationId, "demandes-adhesion");
  revalidatePath(`/dashboard/profile`);
  redirect(await demandesPath(associationId, { ok: "1" }));
}

export async function addAssociationDocumentAction(formData: FormData) {
  const associationId = String(formData.get("associationId") ?? "").trim();
  const documentTypeRaw = String(formData.get("documentType") ?? "").trim();
  if (!associationId) redirect("/dashboard/profile");

  await assertAssociationManagementAccess(associationId);

  if (!ASSOCIATION_DOCUMENT_TYPES.includes(documentTypeRaw as DocumentType)) {
    redirect(await documentsPath(associationId, { err: "type" }));
  }
  const documentType = documentTypeRaw as DocumentType;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(await documentsPath(associationId, { err: "fichier" }));
  }

  try {
    const uploaded = await uploadFile(file, {
      destination: associationDocumentsUploadRelative(associationId),
      maxSize: 10 * 1024 * 1024,
      allowedTypes: [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
      ],
    });

    await db.associationDocument.create({
      data: {
        associationId,
        documentType,
        fileName: file.name || "document",
        fileUrl: uploaded.path,
        fileSize: uploaded.size,
        mimeType: uploaded.mimetype,
        isVerified: false,
      },
    });
  } catch {
    redirect(await documentsPath(associationId, { err: "upload" }));
  }

  revalidateAssociationWorkspaceSegment(associationId, "documents");
  revalidatePath(`/dashboard/profile`);
  redirect(await documentsPath(associationId, { ok: "1" }));
}

export async function removeAssociationDocumentAction(formData: FormData) {
  const associationId = String(formData.get("associationId") ?? "").trim();
  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!associationId || !documentId) redirect("/dashboard/profile");

  await assertAssociationManagementAccess(associationId);

  const row = await db.associationDocument.findFirst({
    where: { id: documentId, associationId, isDeleted: false },
  });
  if (!row) redirect(await documentsPath(associationId, { err: "docnf" }));

  await db.associationDocument.update({
    where: { id: documentId },
    data: { isDeleted: true },
  });

  try {
    await deleteUploadedFile(row.fileUrl);
  } catch {
    // Fichier déjà absent ou chemin non géré — la ligne est tout de même retirée de la liste
  }

  revalidateAssociationWorkspaceSegment(associationId, "documents");
  revalidatePath(`/dashboard/profile`);
  redirect(await documentsPath(associationId, { ok: "2" }));
}
