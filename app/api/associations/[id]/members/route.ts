import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z, type ZodIssue } from "zod";
import { db } from "@/lib/db";
import { verifyAccessToken } from "@/lib/tokens";
import { getUserById } from "@/data/user";
import { logAdminHistory } from "@/lib/admin-history";
import {
  ASSOCIATION_MEMBER_SIMPLE_POSITION,
  isReservedMemberPosition,
} from "@/lib/association-member-kind";

const CreateMemberSchema = z
  .object({
    fullName: z.string().min(2, "Le nom complet est requis"),
    memberKind: z.enum(["executive", "simple"]).optional(),
    position: z.string().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().email("Email invalide").nullable().optional(),
    photoUrl: z.string().url("URL de photo invalide").nullable().optional(),
    isPrimary: z.boolean().optional(),
  })
  .superRefine((val, ctx) => {
    if ((val.memberKind ?? "executive") === "executive") {
      if ((val.position ?? "").trim().length < 2) {
        ctx.addIssue({
          code: "custom",
          message: "Le poste au bureau est requis (min. 2 caractères)",
          path: ["position"],
        });
      } else if (isReservedMemberPosition(val.position ?? "")) {
        ctx.addIssue({
          code: "custom",
          message: "Ce poste est réservé",
          path: ["position"],
        });
      }
    }
  })
  .transform((val) => {
    const kind = val.memberKind ?? "executive";
    return {
      fullName: val.fullName,
      position:
        kind === "simple"
          ? ASSOCIATION_MEMBER_SIMPLE_POSITION
          : (val.position ?? "").trim(),
      phone: val.phone ?? null,
      email: val.email ?? null,
      photoUrl: val.photoUrl ?? null,
      isPrimary: kind === "executive" && Boolean(val.isPrimary),
    };
  });

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return {
      error: NextResponse.json({ error: "Authentification requise" }, { status: 401 }),
    };
  }

  const payload = await verifyAccessToken(token);
  if (!payload?.userId) {
    return {
      error: NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 }),
    };
  }

  const user = await getUserById(payload.userId);
  if (!user) {
    return {
      error: NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 }),
    };
  }

  return { user };
}

async function canAccessAssociation(associationId: string, userId: string, role: string) {
  const association = await db.association.findUnique({
    where: { id: associationId, isDeleted: false },
    select: { id: true, userId: true },
  });

  if (!association) {
    return { error: NextResponse.json({ error: "Association introuvable" }, { status: 404 }) };
  }

  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && association.userId !== userId) {
    return {
      error: NextResponse.json(
        { error: "Vous ne pouvez gérer que les membres de votre association" },
        { status: 403 }
      ),
    };
  }

  return { association };
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
    const access = await canAccessAssociation(id, user.id, user.role);
    if ("error" in access) return access.error;

    const members = await db.associationMember.findMany({
      where: { associationId: id, isDeleted: false },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Erreur lors de la récupération des membres :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
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
    const access = await canAccessAssociation(id, user.id, user.role);
    if ("error" in access) return access.error;

    const body = await req.json();
    const parsed = CreateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i: ZodIssue) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const member = await db.$transaction(async (tx) => {
      if (parsed.data.isPrimary) {
        await tx.associationMember.updateMany({
          where: { associationId: id, isDeleted: false },
          data: { isPrimary: false },
        });
      }

      return tx.associationMember.create({
        data: {
          associationId: id,
          ...parsed.data,
        },
      });
    });

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      await logAdminHistory({
        userId: user.id,
        action: "CREATE",
        target: "AssociationMember",
        targetId: member.id,
        metadata: { associationId: id, fullName: member.fullName, position: member.position },
        req,
      });
    }

    return NextResponse.json(
      { message: "Membre ajouté avec succès", member },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'ajout du membre :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
