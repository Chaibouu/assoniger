import Link from "next/link";
import Image from "next/image";
import appConfig from "@/settings";
import { publicNavigation } from "@/settings/navigation";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="w-full"
      style={{ backgroundColor: appConfig.primaryColor }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8">

        {/* Main grid */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-[1fr_auto_auto] md:gap-12">

          {/* Brand */}
          <div className="max-w-sm sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <Image
                src={appConfig.logoUrl}
                alt={appConfig.appName}
                width={36}
                height={36}
                className="shrink-0 brightness-0 invert"
              />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-white">{appConfig.appName}</span>
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-white/60">
                  Plateforme nationale
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              L&apos;annuaire officiel des associations nigériennes. Transparence,
              visibilité et mobilisation citoyenne à travers tout le Niger.
            </p>
            <div
              className="mt-5 h-0.5 w-12 rounded-full bg-white/30"
              aria-hidden="true"
            />
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/50">
              Navigation
            </p>
            <ul className="flex flex-col gap-3">
              {publicNavigation.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="cursor-pointer text-sm text-white/75 transition-colors duration-150 hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-5 text-xs font-bold uppercase tracking-widest text-white/50">
              Contact
            </p>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href={`mailto:${appConfig.contactEmail}`}
                  className="cursor-pointer text-sm text-white/75 transition-colors duration-150 hover:text-white"
                >
                  {appConfig.contactEmail}
                </a>
              </li>
              <li>
                <span className="text-sm text-white/75">{appConfig.contactPhone}</span>
              </li>
              <li>
                <span className="text-sm text-white/75">{appConfig.contactAddress}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-8 sm:flex-row">
          <p className="text-xs text-white/50">
            &copy; {year} {appConfig.appName}. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="cursor-pointer text-xs text-white/50 transition-colors duration-150 hover:text-white"
            >
              Mentions légales
            </Link>
            <Link
              href="#"
              className="cursor-pointer text-xs text-white/50 transition-colors duration-150 hover:text-white"
            >
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
