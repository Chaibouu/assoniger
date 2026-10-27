"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSession } from "@/context/SessionContext";
import { ChevronDown, LayoutDashboard, UserCircle, Settings, LogOut } from "lucide-react";
import appConfig from "@/settings";

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  ASSOCIATION: "Association",
  MEMBER: "Membre",
  MODERATOR: "Modérateur",
  CITIZEN: "Citoyen",
  USER: "Utilisateur",
};

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/dashboard/profile", icon: UserCircle, label: "Mon profil" },
  { href: "/dashboard/settings", icon: Settings, label: "Paramètres" },
];

type Props = { scrolled?: boolean };

const DropdownUser = ({ scrolled = false }: Props) => {
  const [open, setOpen] = useState(false);
  const trigger  = useRef<HTMLButtonElement>(null);
  const dropdown = useRef<HTMLDivElement>(null);
  const { user } = useSession();

  useEffect(() => {
    const handler = ({ target }: MouseEvent) => {
      if (!open) return;
      if (dropdown.current?.contains(target as Node) || trigger.current?.contains(target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  });

  useEffect(() => {
    const handler = ({ key }: KeyboardEvent) => { if (key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  const initials = user?.name
    ? user.name.split(" ").filter(Boolean).slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()
    : "?";

  const roleLabel = ROLE_LABEL[user?.role ?? ""] ?? user?.role ?? "";

  /* Text/icon colors adapt to navbar state */
  const textColor   = scrolled ? "#111827" : "#ffffff";
  const subColor    = scrolled ? "#6b7280" : "rgba(255,255,255,0.65)";
  const borderColor = scrolled ? "#e5e7eb" : "rgba(255,255,255,0.25)";
  const hoverBg     = scrolled ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.12)";

  return (
    <div className="relative">
      <button
        ref={trigger}
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 transition-colors duration-150 focus-visible:outline-none"
        style={{ color: textColor }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = hoverBg)}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <Avatar className="h-9 w-9 shrink-0 ring-2 transition-all duration-150"
          style={{ ringColor: borderColor } as React.CSSProperties}
        >
          <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
          <AvatarFallback
            className="text-xs font-bold text-white"
            style={{ backgroundColor: scrolled ? appConfig.primaryColor : "rgba(255,255,255,0.25)" }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Name + role */}
        <span className="hidden flex-col items-start leading-none lg:flex">
          <span className="text-sm font-semibold" style={{ color: textColor }}>
            {user?.name ?? "Utilisateur"}
          </span>
          <span className="mt-0.5 text-[11px] font-medium" style={{ color: subColor }}>
            {roleLabel}
          </span>
        </span>

        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: subColor }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdown}
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        >
          {/* User info header */}
          <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
              <AvatarFallback
                className="text-sm font-bold text-white"
                style={{ backgroundColor: appConfig.primaryColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{user?.name ?? "Utilisateur"}</p>
              <p className="truncate text-xs text-gray-500">{user?.email ?? ""}</p>
              {roleLabel && (
                <span
                  className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                  style={{ backgroundColor: appConfig.primaryColor }}
                >
                  {roleLabel}
                </span>
              )}
            </div>
          </div>

          {/* Menu items */}
          <ul className="py-2">
            {menuItems.map(({ href, icon: Icon, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Logout */}
          <div className="border-t border-gray-100 py-2">
            <LogoutButton>
              <button className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors duration-150 hover:bg-red-50">
                <LogOut className="h-4 w-4 shrink-0" />
                Se déconnecter
              </button>
            </LogoutButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropdownUser;
