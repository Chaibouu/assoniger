"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { UserRole, LegalStatus } from "@prisma/client";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export type ProfileActionResult = { ok: true } | { ok: false; error: string };

/* ── Mise à jour des infos de l'association ── */

const infoSchema = z.object({
  associationId: z.string().min(1),
  name: z.string().min(3, "Le nom doit comporter au moins 3 caractères"),
  acronym: z.string().optional(),
  slogan: z.string().optional(),
  description: z.string().min(10, "La description doit comporter au moins 10 caractères"),
  contactEmail: z.string().email("Adresse email invalide"),
  contactPhone: z.string().min(3, "Le téléphone est requis"),
  contactWhatsapp: z.string().optional(),
  website: z.string().url("URL invalide").or(z.literal("")).optional(),
  address: z.string().optional(),
  communeId: z.string().optional(),
});

function trim(v: unknown): string { return String(v ?? "").trim(); }
function trimNull(v: unknown): string | null { const s = trim(v); return s === "" ? null : s; }

export async function updateAssociationProfileAction(
  _prev: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  try {
    const auth = await getUser();
    const user = auth?.user?.user;
    if (!user?.id) return { ok: false, error: "Non authentifié" };

    if (user.role !== UserRole.ASSOCIATION) {
      return { ok: false, error: "Accès refusé" };
    }

    const raw = {
      associationId: trim(formData.get("associationId")),
      name: trim(formData.get("name")),
      acronym: trim(formData.get("acronym")),
      slogan: trim(formData.get("slogan")),
      description: trim(formData.get("description")),
      contactEmail: trim(formData.get("contactEmail")),
      contactPhone: trim(formData.get("contactPhone")),
      contactWhatsapp: trim(formData.get("contactWhatsapp")),
      website: trim(formData.get("website")),
      address: trim(formData.get("address")),
      communeId: trim(formData.get("communeId")),
    };

    const parsed = infoSchema.safeParse(raw);
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides";
      return { ok: false, error: msg };
    }

    const d = parsed.data;

    const assoc = await db.association.findFirst({
      where: { id: d.associationId, isDeleted: false },
      select: { id: true, userId: true, departementId: true, communeId: true },
    });
    if (!assoc) return { ok: false, error: "Association introuvable" };
    if (assoc.userId !== user.id) return { ok: false, error: "Accès refusé" };

    let communeConnect: { connect: { id: string } } | undefined;
    let departementConnect: { connect: { id: string } } | undefined;

    if (d.communeId) {
      const commune = await db.commune.findFirst({
        where: { id: d.communeId, isDeleted: false },
        select: { id: true, departementId: true },
      });
      if (commune) {
        communeConnect = { connect: { id: commune.id } };
        departementConnect = { connect: { id: commune.departementId } };
      }
    }

    await db.association.update({
      where: { id: d.associationId },
      data: {
        name: d.name,
        acronym: trimNull(d.acronym),
        slogan: trimNull(d.slogan),
        description: d.description,
        contactEmail: d.contactEmail,
        contactPhone: d.contactPhone,
        contactWhatsapp: trimNull(d.contactWhatsapp),
        website: d.website || null,
        address: trimNull(d.address),
        ...(communeConnect ? { commune: communeConnect } : {}),
        ...(departementConnect ? { departement: departementConnect } : {}),
      },
    });

    revalidatePath("/dashboard/profile");
    revalidatePath(`/associations/${d.associationId}`);
    return { ok: true };
  } catch (e) {
    console.error("[updateAssociationProfileAction]", e);
    return { ok: false, error: "Erreur serveur. Réessayez." };
  }
}

/* ── Changement de mot de passe ── */

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Saisissez l'ancien mot de passe"),
    newPassword: z.string().min(8, "Le nouveau mot de passe doit comporter au moins 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export async function changeAssociationPasswordAction(
  _prev: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  try {
    const auth = await getUser();
    const user = auth?.user?.user;
    if (!user?.id) return { ok: false, error: "Non authentifié" };

    const parsed = passwordSchema.safeParse({
      currentPassword: trim(formData.get("currentPassword")),
      newPassword: trim(formData.get("newPassword")),
      confirmPassword: trim(formData.get("confirmPassword")),
    });
    if (!parsed.success) {
      const msg = parsed.error.errors[0]?.message ?? "Données invalides";
      return { ok: false, error: msg };
    }

    const dbUser = await db.user.findFirst({
      where: { id: user.id, isDeleted: false },
      select: { id: true, password: true },
    });
    if (!dbUser) return { ok: false, error: "Utilisateur introuvable" };
    if (!dbUser.password) return { ok: false, error: "Aucun mot de passe configuré" };

    const match = await bcrypt.compare(parsed.data.currentPassword, dbUser.password);
    if (!match) return { ok: false, error: "L'ancien mot de passe est incorrect" };

    const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
    await db.user.update({ where: { id: user.id }, data: { password: hashed } });

    revalidatePath("/dashboard/profile");
    return { ok: true };
  } catch (e) {
    console.error("[changeAssociationPasswordAction]", e);
    return { ok: false, error: "Erreur serveur. Réessayez." };
  }
}
