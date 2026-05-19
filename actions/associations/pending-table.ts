"use server";

import {
  AssociationStatus,
  type LegalStatus,
  UserRole,
} from "@prisma/client";
import { getUser } from "@/actions/getUser";
import { db } from "@/lib/db";

export type PendingAssociationTableRow = {
  id: string;
  name: string;
  acronym: string | null;
  contactEmail: string;
  contactPhone: string;
  createdAt: Date;
  region: { code: string; name: string };
  legalStatus: LegalStatus;
  status: AssociationStatus;
  /** Chemin ou URL du PDF (arrêté de reconnaissance) pour aperçu inline */
  receiptFileUrl: string | null;
};

function isModerationStaff(role: UserRole) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.MODERATOR
  );
}

/** Liste des associations en attente — réservé aux modérateurs / admins. */
export async function fetchPendingAssociationsTable(): Promise<PendingAssociationTableRow[]> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    throw new Error("Non authentifié");
  }
  if (!isModerationStaff(user.role as UserRole)) {
    throw new Error("Accès refusé");
  }

  const rows = await db.association.findMany({
    where: {
      isDeleted: false,
      status: AssociationStatus.PENDING,
    },
    select: {
      id: true,
      name: true,
      acronym: true,
      contactEmail: true,
      contactPhone: true,
      createdAt: true,
      status: true,
      region: { select: { code: true, name: true } },
      legalStatus: true,
      receiptFileUrl: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    acronym: r.acronym,
    contactEmail: r.contactEmail,
    contactPhone: r.contactPhone,
    createdAt: r.createdAt,
    status: r.status,
    region: r.region,
    legalStatus: r.legalStatus,
    receiptFileUrl: r.receiptFileUrl,
  }));
}

/** Détail d’un dossier pour la page de validation (données soumises à l’inscription). */
export type PendingAssociationDetail = {
  id: string;
  name: string;
  acronym: string | null;
  slogan: string | null;
  description: string;
  status: AssociationStatus;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string | null;
  address: string | null;
  website: string | null;
  legalStatus: LegalStatus;
  receiptNumber: string | null;
  receiptFileUrl: string | null;
  logoUrl: string | null;
  country: string;
  createdAt: Date;
  region: { name: string; code: string };
  departement: { name: string; code: string | null } | null;
  commune: { name: string; code: string | null } | null;
  accountEmail: string | null;
  accountName: string | null;
  presidentName: string | null;
};

/** Une association par id — réservé aux modérateurs / admins (pour lecture dossier). */
export async function fetchPendingAssociationById(
  associationId: string
): Promise<PendingAssociationDetail | null> {
  const session = await getUser();
  const user = session && "user" in session ? session.user?.user : undefined;
  if (!user) {
    throw new Error("Non authentifié");
  }
  if (!isModerationStaff(user.role as UserRole)) {
    throw new Error("Accès refusé");
  }

  const a = await db.association.findFirst({
    where: { id: associationId, isDeleted: false },
    select: {
      id: true,
      name: true,
      acronym: true,
      slogan: true,
      description: true,
      status: true,
      contactEmail: true,
      contactPhone: true,
      contactWhatsapp: true,
      address: true,
      website: true,
      legalStatus: true,
      receiptNumber: true,
      receiptFileUrl: true,
      logoUrl: true,
      country: true,
      createdAt: true,
      region: { select: { name: true, code: true } },
      departement: { select: { name: true, code: true } },
      commune: { select: { name: true, code: true } },
      user: { select: { email: true, name: true } },
      members: {
        where: { isDeleted: false },
        select: { fullName: true, position: true, isPrimary: true },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!a) return null;

  const president =
    a.members.find((m) => m.position === "President") ??
    a.members.find((m) => m.isPrimary) ??
    a.members[0];

  return {
    id: a.id,
    name: a.name,
    acronym: a.acronym,
    slogan: a.slogan,
    description: a.description,
    status: a.status,
    contactEmail: a.contactEmail,
    contactPhone: a.contactPhone,
    contactWhatsapp: a.contactWhatsapp,
    address: a.address,
    website: a.website,
    legalStatus: a.legalStatus,
    receiptNumber: a.receiptNumber,
    receiptFileUrl: a.receiptFileUrl,
    logoUrl: a.logoUrl,
    country: a.country,
    createdAt: a.createdAt,
    region: a.region,
    departement: a.departement,
    commune: a.commune,
    accountEmail: a.user?.email ?? null,
    accountName: a.user?.name ?? null,
    presidentName: president?.fullName ?? null,
  };
}
