import { LoginForm } from "@/components/auth/login-form";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex w-full items-center justify-center overflow-y-auto px-4 py-4" style={{ minHeight: "calc(100dvh - 4rem)" }}>
        <LoginForm />
      </div>
    </>
  );
}
