import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import appConfig from "@/settings";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHero() {
  return (
    <section
      className="relative isolate overflow-hidden border-b bg-gradient-to-b from-muted/50 via-background to-background"
      aria-labelledby="hero-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 h-[min(28rem,80vw)] w-[min(28rem,80vw)] rounded-full opacity-[0.18] blur-3xl"
        style={{ backgroundColor: appConfig.primaryColor }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 bottom-0 h-[min(24rem,70vw)] w-[min(24rem,70vw)] rounded-full opacity-[0.14] blur-3xl"
        style={{ backgroundColor: appConfig.secondaryColor }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.35)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.35)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_50%,transparent_100%)]"
      />

      <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-12 md:py-24 lg:gap-16">
        <div className="flex flex-col gap-6 md:gap-7">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm md:text-sm">
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: appConfig.primaryColor }}
              aria-hidden
            />
            Plateforme nationale des associations
          </div>

          <div className="space-y-3 text-center md:text-left">
            <h1
              id="hero-heading"
              className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              {appConfig.appName}
            </h1>
            <p className="text-balance text-lg font-medium text-foreground/90 sm:text-xl md:text-2xl">
              {appConfig.websiteTitle}
            </p>
            <p className="mx-auto max-w-xl text-pretty text-base text-muted-foreground sm:text-lg md:mx-0">
              {appConfig.websiteDescription}
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:justify-center md:justify-start">
            <Button asChild size="lg" className="gap-2 shadow-md">
              <a href="#associations">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                Explorer les associations
                <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-background/60 backdrop-blur-sm">
              <Link href="/auth/signup">Créer un compte</Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground md:text-left">
            <a href="#apropos" className="underline-offset-4 hover:text-foreground hover:underline">
              En savoir plus sur la plateforme
            </a>
          </p>
        </div>

        <div className="relative flex justify-center md:justify-end">
          <div
            className={cn(
              "relative flex aspect-square w-full max-w-[min(20rem,85vw)] items-center justify-center rounded-3xl border bg-card/40 p-8 shadow-lg backdrop-blur-sm",
              "ring-1 ring-border/60 md:max-w-[22rem]",
            )}
          >
            <div
              aria-hidden
              className="absolute inset-4 rounded-2xl opacity-[0.08]"
              style={{
                background: `linear-gradient(135deg, ${appConfig.primaryColor}, ${appConfig.secondaryColor})`,
              }}
            />
            <Image
              src={appConfig.logoUrl}
              alt={appConfig.appName}
              width={200}
              height={200}
              className="relative z-[1] drop-shadow-md"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
