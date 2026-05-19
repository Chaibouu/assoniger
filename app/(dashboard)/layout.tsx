"use client";
import { useState, useEffect } from "react";
import "./globals.css";
import "./data-tables-css.css";
import "./satoshi.css";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { SidebarClear } from "@/components/Sidebarr/SidebarClear/SidebarClear";
import HeaderClear from "@/components/Sidebarr/SidebarClear/Header";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import { QueryProvider } from "@/components/providers/query-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !user) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, user, router]);

  /* Pas de loader global ici : la session vient déjà du SSR (RootLayout + middleware).
     Un état `isLoading: true` initial forçait un écran de chargement à *chaque* navigation. */

  if (!isAuthenticated && !user) {
    return null;
  }

  return (
    <QueryProvider>
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        {/* <!-- ===== Sidebar Start ===== --> */}
        {/* <Sidebar navigation={adminNavigation} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> */}
        <SidebarClear/>
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          {/* Bannière d'impersonation — visible uniquement en mode audit admin */}
          <ImpersonationBanner />

          {/* <!-- ===== Header Start ===== --> */}
          {/* <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> */}
          <HeaderClear sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">        
            {children}
            </div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
    </div>
    </QueryProvider>
  );
}

