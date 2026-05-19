import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getFullTokenPayload } from "@/lib/tokens";
import { getUserById } from "@/data/user";
import { logAdminHistory } from "@/lib/admin-history";
import { ASSOCIATION_MEMBER_SIMPLE_POSITION } from "@/lib/association-member-kind";

const ManageRequestSchema = z.object({
  action: z.enum(["approve", "reject"]),
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
        { error: "Vous ne pouvez gérer que les demandes de votre association" },
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

    const body = await req.json();
    const parsed = ManageRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const memberRequest = await db.associationMember.findFirst({
      where: {
        id: memberId,
        associationId: id,
        isDeleted: false,
        position: "MEMBER_PENDING",
      },
    });

    if (!memberRequest) {
      return NextResponse.json({ error: "Demande membre introuvable" }, { status: 404 });
    }

    if (parsed.data.action === "approve") {
      const updatedMember = await db.$transaction(async (tx) => {
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
            associationId: id,
            action: "JOIN_REQUEST_APPROVED",
            entity: "AssociationMembership",
            entityId: memberId,
            newValues: {
              status: "APPROVED",
              memberEmail: member.email,
            },
          },
        });

        return member;
      });

      if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
        await logAdminHistory({
          userId: user.id,
          action: "APPROVE",
          target: "AssociationJoinRequest",
          targetId: memberId,
          metadata: { associationId: id, memberEmail: updatedMember.email },
          req,
        });
      }

      return NextResponse.json({
        message: "Demande acceptée. Le membre est maintenant rattaché à l'association.",
        member: updatedMember,
      });
    }

    await db.$transaction(async (tx) => {
      await tx.associationMember.update({
        where: { id: memberId },
        data: { isDeleted: true },
      });

      await tx.activityLog.create({
        data: {
          associationId: id,
          action: "JOIN_REQUEST_REJECTED",
          entity: "AssociationMembership",
          entityId: memberId,
          newValues: {
            status: "REJECTED",
            memberEmail: memberRequest.email,
          },
        },
      });
    });

    if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      await logAdminHistory({
        userId: user.id,
        action: "REJECT",
        target: "AssociationJoinRequest",
        targetId: memberId,
        metadata: { associationId: id, memberEmail: memberRequest.email },
        req,
      });
    }

    return NextResponse.json({
      message: "Demande refusée.",
    });
  } catch (error) {
    console.error("Erreur lors du traitement de la demande membre :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
