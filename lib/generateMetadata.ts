import appConfig from "@/settings";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  // Fetch dynamic settings from the database

  // Return metadata based on settings
  return {
    title: appConfig.websiteTitle || "Default Title",
    description: appConfig.websiteDescription || "Default Description",
    openGraph: {
      title: appConfig.websiteTitle,
      description: appConfig.websiteDescription,
      images: appConfig.logoUrl
        ? [`${process.env.NEXT_PUBLIC_APP_URL}${appConfig.logoUrl}`]
        : [],
    },
  };
}
