import { LoginForm } from "@/components/auth/login-form";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function LoginPage() {
  return (
    <div className="flex h-full flex-col">
      <SiteHeader />
      <div id="login-scroll" className="flex-1 overflow-y-auto bg-slate-50">
        <LoginForm />
      </div>
    </div>
  );
}
