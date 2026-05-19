import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { AssociationStatus, LegalStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getLegacyGeoIdsForRegion } from "@/lib/geo-legacy";
import { NIGER_REGION_CODES, type NigerRegionCode } from "@/lib/geo-labels";
import { getFullTokenPayload } from "@/lib/tokens";
import { getUserById } from "@/data/user";
import { logAdminHistory } from "@/lib/admin-history";

const UpdateAssociationSchema = z.object({
  registrationNumber: z.string().nullable().optional(),
  name: z.string().min(2).optional(),
  acronym: z.string().nullable().optional(),
  slogan: z.string().nullable().optional(),
  description: z.string().min(10).optional(),
  logoUrl: z.string().url().nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  foundingDate: z.coerce.date().nullable().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(3).optional(),
  contactWhatsapp: z.string().nullable().optional(),
  website: z.string().url().nullable().optional(),
  facebookPage: z.string().url().nullable().optional(),
  twitterHandle: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  country: z.string().optional(),
  regionCode: z
    .string()
    .optional()
    .refine((v) => v === undefined || (NIGER_REGION_CODES as readonly string[]).includes(v), {
      message: "Code région invalide",
    }),
  departementId: z.string().cuid().nullable().optional(),
  communeId: z.string().cuid().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  legalStatus: z.nativeEnum(LegalStatus).optional(),
  receiptNumber: z.string().nullable().optional(),
  receiptFileUrl: z.string().url().nullable().optional(),
  receiptExpiryDate: z.coerce.date().nullable().optional(),
  nif: z.string().nullable().optional(),
  ninea: z.string().nullable().optional(),
  totalMembers: z.number().int().nonnegative().nullable().optional(),
  totalVolunteers: z.number().int().nonnegative().nullable().optional(),
  totalStaff: z.number().int().nonnegative().nullable().optional(),
  annualBudget: z.number().nonnegative().nullable().optional(),
  fundingSources: z.string().nullable().optional(),
  bankAccountName: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  bankAccountNumber: z.string().nullable().optional(),
  statutesFileUrl: z.string().url().nullable().optional(),
  governingBoardFileUrl: z.string().url().nullable().optional(),
  taxClearanceUrl: z.string().url().nullable().optional(),
  acceptPublicContact: z.boolean().optional(),
  acceptDonations: z.boolean().optional(),
  displayMembersList: z.boolean().optional(),
  newsletterSubscribed: z.boolean().optional(),
  adminNotes: z.string().nullable().optional(),
  verifiedById: z.string().nullable().optional(),
  verifiedAt: z.coerce.date().nullable().optional(),
  rejectedReason: z.string().nullable().optional(),
  status: z.nativeEnum(AssociationStatus).optional(),
  userId: z.string().nullable().optional(),
  domainIds: z.array(z.string().min(1)).optional(),
});

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return { error: NextResponse.json({ error: "Authentification requise" }, { status: 401 }) };
  }

  const payload = getFullTokenPayload(token);
  if (!payload?.userId) {
    return {
      error: NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 }),
    };
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return { error: NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 }) };
  }

  return { user };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    if ("error" in auth) return auth.error;

    const { user } = auth;
    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "ASSOCIATION"
    ) {
      return NextResponse.json(
        { error: "Accès refusé — rôle ADMIN ou ASSOCIATION requis" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const association = await db.association.findFirst({
      where: { id, isDeleted: false },
      include: {
        region: { select: { id: true, code: true, name: true } },
        departement: { select: { id: true, code: true, name: true } },
        commune: { select: { id: true, code: true, name: true } },
        domains: {
          where: { isDeleted: false },
          include: { domain: true },
        },
        members: { where: { isDeleted: false } },
        events: { where: { isDeleted: false } },
        projects: { where: { isDeleted: false } },
        needs: { where: { isDeleted: false } },
        documents: { where: { isDeleted: false } },
      },
    });

    if (!association) {
      return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && association.userId !== user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez consulter que votre association" },
        { status: 403 }
      );
    }

    return NextResponse.json({ association });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'association :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    if ("error" in auth) return auth.error;

    const { user } = auth;
    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "ASSOCIATION"
    ) {
      return NextResponse.json(
        { error: "Accès refusé — rôle ADMIN ou ASSOCIATION requis" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    if (body?.regionCode == null && typeof body?.region === "string") {
      body.regionCode = body.region;
    }
    const parsed = UpdateAssociationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const existing = await db.association.findFirst({
      where: { id, isDeleted: false },
      select: {
        id: true,
        userId: true,
        regionId: true,
        departementId: true,
        communeId: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez modifier que votre association" },
        { status: 403 }
      );
    }

    const {
      domainIds,
      status,
      verifiedById,
      regionCode,
      departementId: patchDepartementId,
      communeId: patchCommuneId,
      ...updateData
    } = parsed.data;

    const geoScalars: {
      regionId?: string;
      departementId?: string | null;
      communeId?: string | null;
    } = {};

    if (
      regionCode !== undefined ||
      patchDepartementId !== undefined ||
      patchCommuneId !== undefined
    ) {
      const regionRow =
        regionCode !== undefined
          ? await db.region.findFirst({
              where: { code: regionCode as NigerRegionCode, isDeleted: false },
            })
          : await db.region.findFirst({
              where: { id: existing.regionId, isDeleted: false },
            });

      if (!regionRow) {
        return NextResponse.json({ error: "Région invalide" }, { status: 400 });
      }

      let nextDepartementId: string | null = existing.departementId;
      let nextCommuneId: string | null = existing.communeId;

      if (patchCommuneId !== undefined) {
        if (patchCommuneId === null) {
          nextCommuneId = null;
          if (patchDepartementId !== undefined) {
            nextDepartementId = patchDepartementId;
          }
        } else {
          const communeRow = await db.commune.findFirst({
            where: { id: patchCommuneId, isDeleted: false },
            include: {
              departement: { include: { region: true } },
            },
          });
          if (!communeRow || communeRow.departement.region.id !== regionRow.id) {
            return NextResponse.json(
              { error: "La commune ne correspond pas à la région" },
              { status: 400 }
            );
          }
          nextCommuneId = communeRow.id;
          nextDepartementId = communeRow.departementId;
        }
      } else if (patchDepartementId !== undefined) {
        if (patchDepartementId === null) {
          nextDepartementId = null;
          nextCommuneId = null;
        } else {
          const deptRow = await db.departement.findFirst({
            where: {
              id: patchDepartementId,
              regionId: regionRow.id,
              isDeleted: false,
            },
          });
          if (!deptRow) {
            return NextResponse.json(
              { error: "Le département ne correspond pas à la région" },
              { status: 400 }
            );
          }
          nextDepartementId = deptRow.id;
          const firstCommune = await db.commune.findFirst({
            where: { departementId: deptRow.id, isDeleted: false },
            orderBy: { name: "asc" },
          });
          nextCommuneId = firstCommune?.id ?? null;
        }
      }

      if (regionCode !== undefined && patchDepartementId === undefined && patchCommuneId === undefined) {
        const legacy = await getLegacyGeoIdsForRegion(regionRow.id);
        nextDepartementId = legacy.departementId;
        nextCommuneId = legacy.communeId;
      }

      geoScalars.regionId = regionRow.id;
      geoScalars.departementId = nextDepartementId;
      geoScalars.communeId = nextCommuneId;
    }

    const association = await db.association.update({
      where: { id },
      data: {
        ...updateData,
        ...geoScalars,
        ...(user.role === "ADMIN" || user.role === "SUPER_ADMIN"
          ? {
              status,
              verifiedById,
            }
          : {}),
        ...(domainIds
          ? {
              domains: {
                deleteMany: {},
                create: domainIds.map((domainId) => ({ domainId })),
              },
            }
          : {}),
      },
      include: {
        region: { select: { id: true, code: true, name: true } },
        departement: { select: { id: true, code: true, name: true } },
        commune: { select: { id: true, code: true, name: true } },
        domains: {
          include: {
            domain: true,
          },
        },
      },
    });

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      await logAdminHistory({
        userId: user.id,
        action: "UPDATE",
        target: "Association",
        targetId: association.id,
        metadata: { status: association.status, fields: Object.keys(parsed.data) },
        req,
      });
    }

    return NextResponse.json({
      message: "Association mise à jour avec succès",
      association,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'association :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(req);
    if ("error" in auth) return auth.error;

    const { user } = auth;
    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "ASSOCIATION"
    ) {
      return NextResponse.json(
        { error: "Accès refusé — rôle ADMIN ou ASSOCIATION requis" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await db.association.findFirst({ where: { id, isDeleted: false } });
    if (!existing) {
      return NextResponse.json({ error: "Association introuvable" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN" && existing.userId !== user.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez supprimer que votre association" },
        { status: 403 }
      );
    }

    await db.association.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), status: AssociationStatus.DELETED },
    });

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      await logAdminHistory({
        userId: user.id,
        action: "SOFT_DELETE",
        target: "Association",
        targetId: existing.id,
        metadata: { previousStatus: existing.status },
        req,
      });
    }

    return NextResponse.json({ message: "Association supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'association :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
