import { LoginForm } from "@/components/auth/login-form";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function LoginPage() {
  return (
    // Même structure que l'inscription : le layout d'auth ne défile pas (overflow-clip),
    // c'est le formulaire qui porte le défilement (petits écrans, clavier mobile ouvert).
    <div className="flex h-full flex-col">
      <SiteHeader />
      <div className="min-h-0 flex-1">
        <LoginForm />
      </div>
    </div>
  );
}
