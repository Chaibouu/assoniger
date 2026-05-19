import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z, type ZodIssue } from "zod";
import { db } from "@/lib/db";
import { getFullTokenPayload } from "@/lib/tokens";
import { getUserById } from "@/data/user";
import { logAdminHistory } from "@/lib/admin-history";

const UpdateMemberSchema = z.object({
  fullName: z.string().min(2).optional(),
  position: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Email invalide").nullable().optional(),
  photoUrl: z.string().url("URL de photo invalide").nullable().optional(),
  isPrimary: z.boolean().optional(),
});

async function getAuthenticatedUser(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return {
      error: NextResponse.json({ error: "Authentification requise" }, { status: 401 }),
    };
  }

  const payload = getFullTokenPayload(token);
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
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

    const { id, memberId } = await params;
    const access = await canAccessAssociation(id, user.id, user.role);
    if ("error" in access) return access.error;

    const existingMember = await db.associationMember.findFirst({
      where: { id: memberId, associationId: id, isDeleted: false },
    });

    if (!existingMember) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = UpdateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues.map((i: ZodIssue) => i.message).join(", ") },
        { status: 400 }
      );
    }

    const member = await db.$transaction(async (tx) => {
      if (parsed.data.isPrimary) {
        await tx.associationMember.updateMany({
          where: { associationId: id, isDeleted: false, NOT: { id: memberId } },
          data: { isPrimary: false },
        });
      }

      return tx.associationMember.update({
        where: { id: memberId },
        data: parsed.data,
      });
    });

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      await logAdminHistory({
        userId: user.id,
        action: "UPDATE",
        target: "AssociationMember",
        targetId: member.id,
        metadata: { associationId: id, fields: Object.keys(parsed.data) },
        req,
      });
    }

    return NextResponse.json({ message: "Membre modifié avec succès", member });
  } catch (error) {
    console.error("Erreur lors de la modification du membre :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
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

    const { id, memberId } = await params;
    const access = await canAccessAssociation(id, user.id, user.role);
    if ("error" in access) return access.error;

    const existingMember = await db.associationMember.findFirst({
      where: { id: memberId, associationId: id, isDeleted: false },
    });

    if (!existingMember) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    await db.associationMember.update({
      where: { id: memberId },
      data: { isDeleted: true },
    });

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      await logAdminHistory({
        userId: user.id,
        action: "SOFT_DELETE",
        target: "AssociationMember",
        targetId: memberId,
        metadata: { associationId: id, fullName: existingMember.fullName },
        req,
      });
    }

    return NextResponse.json({ message: "Membre supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du membre :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
