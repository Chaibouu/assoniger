import { LoginButton } from "@/components/auth/login-button";
import { Button } from "@/components/ui/button";
import appConfig from "@/settings";

export function SiteContact() {
  return (
    <section id="contact" className="mx-auto w-full max-w-6xl px-4 pb-20">
      <div className="rounded-2xl border p-6 md:flex md:items-center md:justify-between md:p-8">
        <div>
          <h2 className="text-2xl font-semibold">Vous gerez une association ?</h2>
          <p className="mt-2 text-muted-foreground">
            Creez votre espace, publiez vos actions et rendez vos besoins visibles.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {appConfig.contactEmail} - {appConfig.contactPhone}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <LoginButton asChild>
            <Button size="lg">Demarrer</Button>
          </LoginButton>
        </div>
      </div>
    </section>
  );
}
