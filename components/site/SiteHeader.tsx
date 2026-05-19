"use client";

import Link from "next/link";
import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import DropdownUser from "@/components/Header/DropdownUser";
import { useSession } from "@/context/SessionContext";
import appConfig from "@/settings";
import { publicNavigation } from "@/settings/navigation";

export function SiteHeader() {
  const { isAuthenticated } = useSession();

  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <div className="text-lg font-semibold">{appConfig.appName}</div>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {publicNavigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        {isAuthenticated ? (
          <DropdownUser />
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/signup">S'inscrire</Link>
            </Button>
            <LoginButton asChild>
              <Button variant="default" size="sm">
                Se connecter
              </Button>
            </LoginButton>
          </div>
        )}
      </div>
    </header>
  );
}
