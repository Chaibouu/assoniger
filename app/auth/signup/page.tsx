import { RegisterForm } from "@/components/auth/register-form";
import { fetchPublicRegions } from "@/actions/public-geo";
import { SiteHeader } from "@/components/site/SiteHeader";

export default async function SignupPage() {
  let initialRegions = [] as Awaited<ReturnType<typeof fetchPublicRegions>>;
  try {
    initialRegions = await fetchPublicRegions();
  } catch (e) {
    console.error("[SignupPage] fetchPublicRegions", e);
  }

  return (
    <div className="flex h-full flex-col">
      <SiteHeader />
      <div className="min-h-0 flex-1">
        <RegisterForm initialRegions={initialRegions} />
      </div>
    </div>
  );
}
