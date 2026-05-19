"use client";

import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from "@/components/ui/card";
import { Header } from "@/components/auth/header";
import { Social } from "@/components/auth/social";
import { BackButton } from "@/components/auth/back-button";
import appConfig from "@/settings";
import { cn } from "@/lib/utils";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
  cardClassName?: string;
};

export const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial,
  cardClassName
}: CardWrapperProps) => {
  return (
    <Card
      className={cn("w-full max-w-[450px] border-0 shadow-2xl", cardClassName)}
      style={{
        backgroundColor: "rgba(255,255,255,0.96)",
      }}
    >
      <div
        className="h-1.5 w-full rounded-t-xl"
        style={{
          backgroundColor: appConfig.primaryColor,
        }}
      />
      <CardHeader>
        <Header label={headerLabel} />
      </CardHeader>
      <CardContent className="pt-1">
        {children}
      </CardContent>
      {showSocial && (
        <CardFooter>
          <Social />
        </CardFooter>
      )}
      <CardFooter>
        <BackButton
          label={backButtonLabel}
          href={backButtonHref}
        />
      </CardFooter>
    </Card>
  );
};