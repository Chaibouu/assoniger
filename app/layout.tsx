import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import appConfig from "@/settings";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/context/SessionContext";
import { getUser } from "@/actions/getUser";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: appConfig.websiteTitle,
  description: appConfig.websiteDescription,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {user} = await getUser();
  return (
    <SessionProvider user={user?.user}>
      <html lang="en">
        <Toaster />
        <body className={inter.className}>{children}</body>
      </html>
   </SessionProvider>
  );
}
