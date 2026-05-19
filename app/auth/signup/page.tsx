import { RegisterForm } from "@/components/auth/register-form";
import { fetchPublicRegions } from "@/actions/public-geo";

export default async function SignupPage() {
  let initialRegions = [] as Awaited<ReturnType<typeof fetchPublicRegions>>;
  try {
    initialRegions = await fetchPublicRegions();
  } catch (e) {
    console.error("[SignupPage] fetchPublicRegions", e);
  }

  return <RegisterForm initialRegions={initialRegions} />;
}
