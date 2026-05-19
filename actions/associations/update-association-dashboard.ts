"use server";

import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import { getLegacyGeoIdsForRegion } from "@/lib/geo-legacy";
import { NIGER_REGION_CODES, type NigerRegionCode } from "@/lib/geo-labels";
import { type Prisma, LegalStatus, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  revalidateAssociationWorkspaceRoot,
  resolveAssociationWorkspaceBasePath,
} from "@/lib/association-workspace-paths";

function trimOrEmpty(v: unknown): string {
  return String(v ?? "").trim();
}

function trimOrNull(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
}

function optUrl(v: string | null): string | null {
  if (v === null || v === "") return null;
  try {
    // eslint-disable-next-line no-new -- validation only
    new URL(v);
    return v;
  } catch {
    return null;
  }
}

function readBool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

function optInt(fd: FormData, key: string): number | null {
  const s = trimOrEmpty(fd.get(key));
  if (s === "") return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function optFloat(fd: FormData, key: string): number | null {
  const s = trimOrEmpty(fd.get(key));
  if (s === "") return null;
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function optDate(fd: FormData, key: string): Date | null {
  const s = trimOrEmpty(fd.get(key));
  if (s === "") return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function updateAssociationDashboardAction(formData: FormData): Promise<void> {
  const auth = await getUser();
  const user = auth?.user?.user;
  if (!user) redirect("/auth/login");

  if (
    user.role !== UserRole.ADMIN &&
    user.role !== UserRole.SUPER_ADMIN &&
    user.role !== UserRole.ASSOCIATION
  ) {
    redirect("/unauthorized");
  }

  const associationId = trimOrEmpty(formData.get("associationId"));
  if (!associationId) return;

  const existing = await db.association.findFirst({
    where: { id: associationId, isDeleted: false },
    select: {
      id: true,
      userId: true,
      regionId: true,
      departementId: true,
      communeId: true,
    },
  });
  if (!existing) return;

  if (
    user.role === UserRole.ASSOCIATION &&
    existing.userId &&
    existing.userId !== user.id
  ) {
    redirect("/unauthorized");
  }

  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

  const nextName = trimOrEmpty(formData.get("name"));
  const nextDescription = trimOrEmpty(formData.get("description"));
  const nextEmail = trimOrEmpty(formData.get("contactEmail"));
  const nextPhone = trimOrEmpty(formData.get("contactPhone"));
  const nextRegionCode = trimOrEmpty(formData.get("regionCode"));
  const nextLegalStatus = trimOrEmpty(formData.get("legalStatus"));
  const nextCommuneId = trimOrEmpty(formData.get("communeId"));

  if (!nextName || !nextDescription || !nextEmail || !nextPhone) return;
  if (!(NIGER_REGION_CODES as readonly string[]).includes(nextRegionCode)) return;
  if (!Object.values(LegalStatus).includes(nextLegalStatus as LegalStatus)) return;

  const regionRow = await db.region.findFirst({
    where: { code: nextRegionCode as NigerRegionCode, isDeleted: false },
  });
  if (!regionRow) return;

  let departementId: string | null = existing.departementId;
  let communeId: string | null = existing.communeId;

  if (nextCommuneId) {
    const communeRow = await db.commune.findFirst({
      where: { id: nextCommuneId, isDeleted: false },
      include: {
        departement: { include: { region: true } },
      },
    });
    if (!communeRow || communeRow.departement.region.id !== regionRow.id) {
      console.error("[updateAssociationDashboardAction] commune / région incohérents");
      return;
    }
    communeId = communeRow.id;
    departementId = communeRow.departementId;
  } else {
    const legacy = await getLegacyGeoIdsForRegion(regionRow.id);
    departementId = legacy.departementId;
    communeId = legacy.communeId;
  }

  const domainIds = formData
    .getAll("domainIds")
    .filter((v): v is string => typeof v === "string" && v.length > 0);

  const uniqueDomainIds = [...new Set(domainIds)];
  if (uniqueDomainIds.length > 0) {
    const count = await db.domain.count({
      where: { id: { in: uniqueDomainIds }, isDeleted: false },
    });
    if (count !== uniqueDomainIds.length) return;
  }

  const updateData: Prisma.AssociationUpdateInput = {
    name: nextName,
    acronym: trimOrNull(formData.get("acronym")),
    slogan: trimOrNull(formData.get("slogan")),
    description: nextDescription,
    logoUrl: optUrl(trimOrNull(formData.get("logoUrl"))),
    coverImageUrl: optUrl(trimOrNull(formData.get("coverImageUrl"))),
    foundingDate: optDate(formData, "foundingDate"),
    contactEmail: nextEmail,
    contactPhone: nextPhone,
    contactWhatsapp: trimOrNull(formData.get("contactWhatsapp")),
    website: optUrl(trimOrNull(formData.get("website"))),
    facebookPage: optUrl(trimOrNull(formData.get("facebookPage"))),
    twitterHandle: trimOrNull(formData.get("twitterHandle")),
    address: trimOrNull(formData.get("address")),
    country: trimOrEmpty(formData.get("country")) || "Niger",
    region: { connect: { id: regionRow.id } },
    departement: departementId ? { connect: { id: departementId } } : { disconnect: true },
    commune: communeId ? { connect: { id: communeId } } : { disconnect: true },
    latitude: optFloat(formData, "latitude"),
    longitude: optFloat(formData, "longitude"),
    legalStatus: nextLegalStatus as LegalStatus,
    receiptNumber: trimOrNull(formData.get("receiptNumber")),
    receiptFileUrl: optUrl(trimOrNull(formData.get("receiptFileUrl"))),
    receiptExpiryDate: optDate(formData, "receiptExpiryDate"),
    nif: trimOrNull(formData.get("nif")),
    ninea: trimOrNull(formData.get("ninea")),
    totalMembers: optInt(formData, "totalMembers"),
    totalVolunteers: optInt(formData, "totalVolunteers"),
    totalStaff: optInt(formData, "totalStaff"),
    annualBudget: optFloat(formData, "annualBudget"),
    fundingSources: trimOrNull(formData.get("fundingSources")),
    bankAccountName: trimOrNull(formData.get("bankAccountName")),
    bankName: trimOrNull(formData.get("bankName")),
    bankAccountNumber: trimOrNull(formData.get("bankAccountNumber")),
    statutesFileUrl: optUrl(trimOrNull(formData.get("statutesFileUrl"))),
    governingBoardFileUrl: optUrl(trimOrNull(formData.get("governingBoardFileUrl"))),
    taxClearanceUrl: optUrl(trimOrNull(formData.get("taxClearanceUrl"))),
    acceptPublicContact: readBool(formData, "acceptPublicContact"),
    acceptDonations: readBool(formData, "acceptDonations"),
    displayMembersList: readBool(formData, "displayMembersList"),
    newsletterSubscribed: readBool(formData, "newsletterSubscribed"),
    domains: {
      deleteMany: {},
      create: uniqueDomainIds.map((domainId) => ({ domainId })),
    },
  };

  if (isAdmin) {
    updateData.registrationNumber = trimOrNull(formData.get("registrationNumber"));
    updateData.adminNotes = trimOrNull(formData.get("adminNotes"));
  }

  try {
    await db.association.update({
      where: { id: associationId },
      data: updateData,
    });
  } catch (e) {
    console.error("[updateAssociationDashboardAction]", e);
    return;
  }

  revalidateAssociationWorkspaceRoot(associationId);
  revalidatePath("/dashboard/associations");
  revalidatePath("/dashboard/associations/pending");
  const workspaceBase = await resolveAssociationWorkspaceBasePath(associationId);
  redirect(workspaceBase);
}
