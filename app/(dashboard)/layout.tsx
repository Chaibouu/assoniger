"use client";
import { useState } from "react";
import Sidebar from "@/components/Sidebarr/Sidebar";
import Header from "@/components/Header";
import Loader from "@/components/common/Loader";
import { adminNavigation } from "@/settings/navigation";
import "./globals.css";
import "./data-tables-css.css";
import "./satoshi.css";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/SessionContext";
import { SidebarClear } from "@/components/Sidebarr/SidebarClear/SidebarClear";
import HeaderClear from "@/components/Sidebarr/SidebarClear/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

    
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSession();
  const router = useRouter();  
  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="dark:bg-boxdark-2 dark:text-bodydark">
      <div className="flex h-screen overflow-hidden">
        {/* <!-- ===== Sidebar Start ===== --> */}
        {/* <Sidebar navigation={adminNavigation} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} /> */}
        <SidebarClear open={sidebarOpen} setOpen={setSidebarOpen}/>
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
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
  );
}

