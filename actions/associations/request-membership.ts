"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { AssociationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getClientIP } from "@/lib/geo";
import { rateLimitRedis } from "@/lib/rateLimit";

export type MembershipRequestResult =
  | { ok: true }
  | { ok: false; error: string };

const schema = z.object({
  associationId: z.string().min(1),
  fullName: z.string().min(2, "Le nom complet est requis (min. 2 caractères)"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().min(6, "Numéro de téléphone requis"),
  motivation: z.string().max(1000).optional(),
});

function trim(v: unknown): string {
  return String(v ?? "").trim();
}

export async function requestMembershipAction(
  _prev: MembershipRequestResult | null,
  formData: FormData
): Promise<MembershipRequestResult> {
  try {
    const raw = {
      associationId: trim(formData.get("associationId")),
      fullName: trim(formData.get("fullName")),
      email: trim(formData.get("email")),
      phone: trim(formData.get("phone")),
      motivation: trim(formData.get("motivation")),
    };

    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides";
      return { ok: false, error: msg };
    }

    const d = parsed.data;

    /* Formulaire public sans compte : limite par visiteur contre l'envoi massif de fausses demandes */
    const ip = getClientIP({ headers: await headers() });
    const limited = await rateLimitRedis(`join-request:${ip}`, { windowMs: 60 * 60 * 1000, max: 5 });
    if (limited) {
      return { ok: false, error: "Trop de demandes envoyées. Réessayez dans une heure." };
    }

    /* Vérifier que l'association existe et est active */
    const assoc = await db.association.findFirst({
      where: {
        id: d.associationId,
        isDeleted: false,
        status: { in: [AssociationStatus.ACTIVE, AssociationStatus.VERIFIED] },
      },
      select: { id: true, name: true },
    });
    if (!assoc) {
      return { ok: false, error: "Association introuvable ou non disponible." };
    }

    /* Vérifier qu'aucune demande identique n'est déjà en attente */
    const existing = await db.associationMember.findFirst({
      where: {
        associationId: d.associationId,
        email: d.email,
        isDeleted: false,
      },
    });
    if (existing) {
      return {
        ok: false,
        error:
          "Une demande avec cette adresse email existe déjà pour cette association. Veuillez contacter l'association directement.",
      };
    }

    await db.associationMember.create({
      data: {
        associationId: d.associationId,
        fullName: d.fullName,
        email: d.email,
        phone: d.phone || null,
        position: "MEMBER_PENDING",
        isPrimary: false,
      },
    });

    revalidatePath(`/dashboard/adhesion-association/${d.associationId}`);
    revalidatePath(`/associations/${d.associationId}`);

    return { ok: true };
  } catch (e) {
    console.error("[requestMembershipAction]", e);
    return { ok: false, error: "Erreur serveur. Veuillez réessayer." };
  }
}
