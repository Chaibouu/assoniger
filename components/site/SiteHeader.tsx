"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import DropdownUser from "@/components/Header/DropdownUser";
import { useSession } from "@/context/SessionContext";
import appConfig from "@/settings";
import { publicNavigation } from "@/settings/navigation";

export function SiteHeader() {
  const { isAuthenticated } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "#ffffff" : appConfig.primaryColor,
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.08)" : "none",
        borderBottom: scrolled ? "1px solid #e5e7eb" : "none",
      }}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer shrink-0 group">
          <Image
            src={appConfig.logoUrl}
            alt={appConfig.appName}
            width={36}
            height={36}
            className={`shrink-0 transition-all duration-300 ${scrolled ? "" : "brightness-0 invert"}`}
            priority
          />
          <div className="flex flex-col leading-none">
            <span
              className="text-sm font-bold tracking-tight transition-colors duration-300"
              style={{ color: scrolled ? appConfig.primaryColor : "#ffffff" }}
            >
              {appConfig.appName}
            </span>
            <span
              className="text-[10px] font-medium tracking-wide hidden sm:block transition-colors duration-300"
              style={{ color: scrolled ? "#6b7280" : "rgba(255,255,255,0.70)" }}
            >
              Plateforme nationale
            </span>
          </div>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
          {publicNavigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative px-4 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer"
              style={{ color: scrolled ? "#374151" : "rgba(255,255,255,0.85)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = appConfig.secondaryColor;
                const line = (e.currentTarget as HTMLAnchorElement).querySelector("span") as HTMLSpanElement;
                if (line) line.style.width = "100%";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = scrolled ? "#374151" : "rgba(255,255,255,0.85)";
                const line = (e.currentTarget as HTMLAnchorElement).querySelector("span") as HTMLSpanElement;
                if (line) line.style.width = "0%";
              }}
            >
              {item.label}
              <span
                style={{
                  display: "block",
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  height: "2px",
                  width: "0%",
                  backgroundColor: appConfig.secondaryColor,
                  borderRadius: "9999px",
                  transition: "width 250ms ease",
                }}
              />
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {isAuthenticated ? (
            <DropdownUser scrolled={scrolled} />
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:flex h-9 px-4 text-sm font-medium cursor-pointer transition-all duration-150 hover:text-white"
                style={{ color: scrolled ? "#374151" : "rgba(255,255,255,0.85)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = appConfig.secondaryColor;
                  (e.currentTarget as HTMLElement).style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = scrolled ? "#374151" : "rgba(255,255,255,0.85)";
                }}
              >
                <Link href="/auth/signup">S&apos;inscrire</Link>
              </Button>
              <LoginButton asChild>
                <Button
                  size="sm"
                  className="h-9 cursor-pointer gap-1.5 px-4 text-sm font-semibold shadow-sm transition-all duration-150"
                  style={
                    scrolled
                      ? { backgroundColor: appConfig.primaryColor, color: "#ffffff" }
                      : { backgroundColor: "#ffffff", color: appConfig.primaryColor }
                  }
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = appConfig.secondaryColor;
                    (e.currentTarget as HTMLElement).style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = scrolled ? appConfig.primaryColor : "#ffffff";
                    (e.currentTarget as HTMLElement).style.color = scrolled ? "#ffffff" : appConfig.primaryColor;
                  }}
                >
                  Se connecter
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </LoginButton>
            </>
          )}

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-150 cursor-pointer md:hidden"
            style={{
              borderColor: scrolled ? "#e5e7eb" : "rgba(255,255,255,0.30)",
              color: scrolled ? "#374151" : "#ffffff",
            }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="border-t px-4 pb-4 pt-3 md:hidden"
          style={{
            backgroundColor: scrolled ? "#ffffff" : appConfig.primaryColor,
            borderColor: scrolled ? "#e5e7eb" : "rgba(255,255,255,0.20)",
          }}
        >
          <nav className="flex flex-col gap-1" aria-label="Menu mobile">
            {publicNavigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-4 py-3 text-sm font-medium cursor-pointer transition-colors duration-150"
                style={{ color: scrolled ? "#374151" : "rgba(255,255,255,0.85)" }}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div
              className="mt-2 flex flex-col gap-2 border-t pt-3"
              style={{ borderColor: scrolled ? "#e5e7eb" : "rgba(255,255,255,0.20)" }}
            >
              <Link
                href="/auth/signup"
                className="rounded-lg px-4 py-3 text-sm font-medium cursor-pointer"
                style={{ color: scrolled ? "#374151" : "rgba(255,255,255,0.85)" }}
                onClick={() => setMobileOpen(false)}
              >
                S&apos;inscrire
              </Link>
              <LoginButton asChild>
                <button
                  className="flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold cursor-pointer"
                  style={
                    scrolled
                      ? { backgroundColor: appConfig.primaryColor, color: "#ffffff" }
                      : { backgroundColor: "#ffffff", color: appConfig.primaryColor }
                  }
                >
                  Se connecter
                </button>
              </LoginButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
