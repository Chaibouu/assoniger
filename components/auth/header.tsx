import { Poppins } from "next/font/google";
import Image from "next/image";

import { cn } from "@/lib/utils";

const font = Poppins({
  subsets: ["latin"],
  weight: ["600"],
});

interface HeaderProps {
  label: string;
};

export const Header = ({
  label,
}: HeaderProps) => {
  return (
    <div className="w-full flex flex-col gap-y-4 items-center justify-center">
      <Image
        src="/logo.png"
        alt="Logo Assos Niger"
        width={120}
        height={120}
        priority
        className="h-auto w-20 sm:w-24"
      />
      <p className="text-muted-foreground text-sm">
        {label}
      </p>
    </div>
  );
};