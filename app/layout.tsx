import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SessionProvider } from "@/context/SessionContext";
import { getUser } from "@/actions/getUser";
import { generateMetadata } from "@/lib/generateMetadata";
const inter = Inter({ subsets: ["latin"] });

export const metadata = generateMetadata();


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
