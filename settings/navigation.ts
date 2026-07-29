export interface ChildrenItem {
  title: string;
  path: string;
  allowedRoles: string[];
}
export interface NavigationItem {
  title: string;
  icon: string;
  path: string;
  children?: ChildrenItem[];
  allowedRoles: string[];
}

export interface PublicNavigationItem {
  label: string;
  href: string;
}

/** Rôles autorisés pour la section Paramètres et ses sous-pages */
const SETTINGS_ROLES = [
  "ADMIN",
  "SUPER_ADMIN",
];

/** Sections espace association (membres, adhésion, documents, candidat) */
const ASSOCIATION_WORKSPACE_ROLES = ["ASSOCIATION"];

export const adminNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    icon: "material-symbols:dashboard",
    path: "/dashboard",
    allowedRoles: ["USER","ADMIN","SUPER_ADMIN","ASSOCIATION"],
  },
  {
    title: "Profile",
    icon: "material-symbols:person",
    path: "/dashboard/profile",
    allowedRoles: ["USER","ADMIN","SUPER_ADMIN","ASSOCIATION"],
  },
  {
    title: "Membres",
    icon: "mdi:account-group-outline",
    path: "/dashboard/membres-association",
    allowedRoles: ASSOCIATION_WORKSPACE_ROLES,
  },
  {
    title: "Adhésion",
    icon: "mdi:account-plus-outline",
    path: "/dashboard/adhesion-association",
    allowedRoles: ASSOCIATION_WORKSPACE_ROLES,
  },
  {
    title: "Documents",
    icon: "mdi:file-document-multiple-outline",
    path: "/dashboard/documents-association",
    allowedRoles: ASSOCIATION_WORKSPACE_ROLES,
  },
  {
    title: "Candidat",
    icon: "mdi:account-school-outline",
    path: "/dashboard/candidat-association",
    allowedRoles: ASSOCIATION_WORKSPACE_ROLES,
  },
  {
    title: "Associations",
    icon: "eos-icons:admin",
    path: "#",
    children: [
      {
        title: "Toutes les associations",
        path: "/dashboard/associations",
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
      },
      {
        title: "En attente",
        path: "/dashboard/associations/pending",
        allowedRoles: ["ADMIN", "SUPER_ADMIN"],
      },
    ],
    allowedRoles: ["ADMIN", "SUPER_ADMIN"],
  },
  // {
  //   title: "Test",
  //   icon: "material-symbols:dashboard",
  //   path: "/test",
  //   allowedRoles: ["ADMIN", "SUPER_ADMIN"],
  // },
  {
    title: "Paramètres",
    icon: "material-symbols:settings",
    path: "#",
    children: [
      {
        title: "Vue d'ensemble",
        path: "/dashboard/settings",
        allowedRoles: SETTINGS_ROLES,
      },
      {
        title: "Régions",
        path: "/dashboard/settings/region",
        allowedRoles: SETTINGS_ROLES,
      },
      {
        title: "Départements",
        path: "/dashboard/settings/departement",
        allowedRoles: SETTINGS_ROLES,
      },
      {
        title: "Communes",
        path: "/dashboard/settings/commune",
        allowedRoles: SETTINGS_ROLES,
      },
    ],
    allowedRoles: SETTINGS_ROLES,
  },

];

export const publicNavigation: PublicNavigationItem[] = [
  {
    label: "Accueil",
    href: "/",
  },
  {
    label: "A propos",
    href: "/#apropos",
  },
  {
    label: "Explorer",
    href: "/associations",
  },
  {
    label: "Associations",
    href: "/#associations",
  },
  {
    label: "Contact",
    href: "/#contact",
  },
];
