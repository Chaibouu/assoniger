import { UserRole } from "@prisma/client";

/** Rôles autorisés sur la section Paramètres (aligné sur `navigation.ts`). */
export const SETTINGS_ALLOWED_ROLES: UserRole[] = [
  UserRole.USER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
  UserRole.MODERATOR,
  UserRole.ASSOCIATION,
  UserRole.CITIZEN,
];

export function canAccessSettings(role: UserRole | undefined): boolean {
  return role !== undefined && SETTINGS_ALLOWED_ROLES.includes(role);
}
