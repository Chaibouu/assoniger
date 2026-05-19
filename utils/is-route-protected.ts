import { isUserAuthorized } from "@/utils/is-user-authorized";
import { adminNavigation } from "@/settings/navigation";

function matchesNavPath(navPath: string, pathname: string): boolean {
  if (!navPath || navPath === "#") return false;
  if (navPath === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/dashboard/";
  }
  return pathname === navPath || pathname.startsWith(`${navPath}/`);
}

/**
 * Fonction pour vérifier si une route est protégée et si l'utilisateur est autorisé à y accéder
 * @param userRole - Le rôle de l'utilisateur actuel
 * @param pathname - Le chemin de la route actuelle
 * @returns true si l'utilisateur n'est pas autorisé à accéder à la route, false sinon
 */
export const isRouteProtected = (
  userRole: string,
  pathname: string
): boolean => {
  return adminNavigation.some((navItem) => {
    // Liens parents sans enfants (ex. /dashboard/membres-association/[id])
    if (!navItem.children?.length && navItem.allowedRoles) {
      if (matchesNavPath(navItem.path, pathname)) {
        return !isUserAuthorized(userRole, navItem.allowedRoles);
      }
    }

    // Vérification pour les routes avec sous-routes
    if (navItem.children) {
      return navItem.children.some(
        (child) =>
          matchesNavPath(child.path, pathname) &&
          !isUserAuthorized(userRole, child.allowedRoles)
      );
    }

    return false;
  });
};
