import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z, type ZodIssue } from "zod";
import { AssociationStatus, DocumentType, LegalStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getLegacyGeoIdsForRegion } from "@/lib/geo-legacy";
import { NIGER_REGION_CODES, type NigerRegionCode } from "@/lib/geo-labels";
import { getFullTokenPayload } from "@/lib/tokens";
import { getUserById } from "@/data/user";
import { logAdminHistory } from "@/lib/admin-history";

const CreateAssociationSchema = z.object({
  name: z.string().min(2, "Le nom est requis"),
  description: z.string().min(10, "La description est requise"),
  regionCode: z
    .string()
    .min(1, "La région est requise")
    .refine((v): v is NigerRegionCode =>
      (NIGER_REGION_CODES as readonly string[]).includes(v)
    ),
  legalStatus: z.nativeEnum(LegalStatus),
  contactEmail: z.string().email("Email de contact invalide"),
  contactPhone: z.string().min(3, "Téléphone de contact requis"),
  acronym: z.string().optional(),
  slogan: z.string().optional(),
  logoUrl: z.string().url("URL de logo invalide").optional(),
  coverImageUrl: z.string().url("URL de couverture invalide").optional(),
  foundingDate: z.coerce.date().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  departementId: z.string().cuid().optional().nullable(),
  communeId: z.string().cuid().optional().nullable(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  receiptNumber: z.string().optional(),
  receiptFileUrl: z.string().url("URL de récépissé invalide").optional(),
  receiptExpiryDate: z.coerce.date().optional(),
  nif: z.string().optional(),
  ninea: z.string().optional(),
  totalMembers: z.number().int().nonnegative().optional(),
  totalVolunteers: z.number().int().nonnegative().optional(),
  totalStaff: z.number().int().nonnegative().optional(),
  annualBudget: z.number().nonnegative().optional(),
  fundingSources: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  statutesFileUrl: z.string().url("URL statuts invalide").optional(),
  governingBoardFileUrl: z
    .string()
    .url("URL composition du bureau invalide")
    .optional(),
  taxClearanceUrl: z.string().url("URL quitus fiscal invalide").optional(),
  acceptPublicContact: z.boolean().optional(),
  acceptDonations: z.boolean().optional(),
  displayMembersList: z.boolean().optional(),
  newsletterSubscribed: z.boolean().optional(),
  status: z.nativeEnum(AssociationStatus).optional(),
  domainIds: z.array(z.string().min(1)).optional(),
  userId: z.string().optional(),
  presidentName: z.string().min(2).optional(),
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

export async function POST(req: NextRequest) {
  try {
    console.info("[ASSOCIATIONS_API][POST] Début création association");
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

    const body = await req.json();
    if (body?.regionCode == null && typeof body?.region === "string") {
      body.regionCode = body.region;
    }
    console.info("[ASSOCIATIONS_API][POST] Payload reçu", {
      name: body?.name,
      contactEmail: body?.contactEmail,
      regionCode: body?.regionCode ?? body?.region,
      legalStatus: body?.legalStatus,
      domainCount: Array.isArray(body?.domainIds) ? body.domainIds.length : 0,
    });
    const parsed = CreateAssociationSchema.safeParse(body);
    if (!parsed.success) {
      console.warn("[ASSOCIATIONS_API][POST] Validation échouée", {
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
      return NextResponse.json(
        { error: parsed.error.issues.map((i: ZodIssue) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const {
      domainIds,
      userId,
      status,
      presidentName,
      regionCode,
      departementId: inputDepartementId,
      communeId: inputCommuneId,
      ...associationData
    } = parsed.data;

    const regionRow = await db.region.findFirst({
      where: { code: regionCode, isDeleted: false },
    });
    if (!regionRow) {
      return NextResponse.json({ error: "Région inconnue ou désactivée" }, { status: 400 });
    }

    let departementId = inputDepartementId ?? null;
    let communeId = inputCommuneId ?? null;

    if (communeId) {
      const commune = await db.commune.findFirst({
        where: { id: communeId, isDeleted: false },
        include: {
          departement: { include: { region: true } },
        },
      });
      if (!commune || commune.departement.region.id !== regionRow.id) {
        return NextResponse.json(
          { error: "La commune ne correspond pas à la région choisie" },
          { status: 400 }
        );
      }
      departementId = commune.departementId;
    } else if (departementId) {
      const dept = await db.departement.findFirst({
        where: { id: departementId, regionId: regionRow.id, isDeleted: false },
      });
      if (!dept) {
        return NextResponse.json(
          { error: "Le département ne correspond pas à la région choisie" },
          { status: 400 }
        );
      }
      const firstCommune = await db.commune.findFirst({
        where: { departementId: dept.id, isDeleted: false },
        orderBy: { name: "asc" },
      });
      communeId = firstCommune?.id ?? null;
      if (!communeId) {
        return NextResponse.json(
          { error: "Aucune commune enregistrée pour ce département" },
          { status: 400 }
        );
      }
    } else {
      const legacy = await getLegacyGeoIdsForRegion(regionRow.id);
      departementId = legacy.departementId;
      communeId = legacy.communeId;
    }

    if (!departementId || !communeId) {
      return NextResponse.json(
        { error: "Référentiel géographique incomplet pour cette région" },
        { status: 400 }
      );
    }

    const resolvedUserId = user.role === "ADMIN" ? userId ?? user.id : user.id;
    const resolvedStatus =
      user.role === "ADMIN" && status ? status : AssociationStatus.PENDING;
    console.info("[ASSOCIATIONS_API][POST] Données résolues", {
      resolvedUserId,
      resolvedStatus,
      domainCount: domainIds?.length || 0,
    });

    const association = await db.$transaction(async (tx) => {
      const createdAssociation = await tx.association.create({
        data: {
          ...associationData,
          regionId: regionRow.id,
          departementId,
          communeId,
          status: resolvedStatus,
          userId: resolvedUserId,
          ...(domainIds?.length
            ? {
                domains: {
                  create: domainIds.map((domainId: string) => ({ domainId })),
                },
              }
            : {}),
        },
        include: {
          domains: {
            include: {
              domain: true,
            },
          },
        },
      });

      if (presidentName) {
        await tx.associationMember.create({
          data: {
            associationId: createdAssociation.id,
            fullName: presidentName,
            position: "President",
            email: createdAssociation.contactEmail,
            isPrimary: true,
          },
        });
      }

      if (createdAssociation.receiptFileUrl) {
        await tx.associationDocument.create({
          data: {
            associationId: createdAssociation.id,
            documentType: DocumentType.RECEIPT,
            fileName: "arrete-reconnaissance.pdf",
            fileUrl: createdAssociation.receiptFileUrl,
            mimeType: "application/pdf",
            isVerified: false,
          },
        });
      }

      return createdAssociation;
    });

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      await logAdminHistory({
        userId: user.id,
        action: "CREATE",
        target: "Association",
        targetId: association.id,
        metadata: { name: association.name, status: association.status },
        req,
      });
    }

    return NextResponse.json(
      { message: "Association créée avec succès", association },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de l'association :", error);
    console.error("[ASSOCIATIONS_API][POST] Détails erreur", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? "10"), 1), 100);
    const status = searchParams.get("status");
    const region = searchParams.get("region");
    const legalStatus = searchParams.get("legalStatus");
    const search = searchParams.get("search");
    const domainId = searchParams.get("domainId");

    const where: Record<string, unknown> = {
      isDeleted: false,
    };

    if (status && Object.values(AssociationStatus).includes(status as AssociationStatus)) {
      where.status = status as AssociationStatus;
    }

    if (region) {
      where.region = { code: region, isDeleted: false };
    }

    if (
      legalStatus &&
      Object.values(LegalStatus).includes(legalStatus as LegalStatus)
    ) {
      where.legalStatus = legalStatus as LegalStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { acronym: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (domainId) {
      where.domains = {
        some: { domainId },
      };
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      where.userId = user.id;
    }

    const [total, associations] = await Promise.all([
      db.association.count({ where }),
      db.association.findMany({
        where,
        include: {
          region: { select: { id: true, code: true, name: true } },
          domains: {
            include: { domain: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      data: associations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des associations :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
