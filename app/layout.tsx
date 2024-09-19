import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import appConfig from "@/settings";
import { Toaster } from "@/components/ui/sonner";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${appConfig.websiteTitle}`,
  description: `${appConfig.websiteDescription}`,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    // <SessionProvider session={session}>
      <html lang="en">
        <Toaster />
        <body className={inter.className}>{children}</body>
      </html>
    // </SessionProvider>
  );
}
