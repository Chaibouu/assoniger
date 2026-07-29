"use client";

import { useState } from "react";
import { Pencil, Lock } from "lucide-react";
import { AssociationInfoEditForm } from "@/components/dashboard/profile/AssociationInfoEditForm";
import { AssociationPasswordForm } from "@/components/dashboard/profile/AssociationPasswordForm";

type Region = { id: string; name: string; code: string };
type Departement = { id: string; name: string; regionId: string };
type Commune = { id: string; name: string; departementId: string };

type Association = {
  id: string;
  name: string;
  acronym: string | null;
  slogan: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  website: string | null;
  address: string | null;
  region: { name: string; code: string | null };
  departement: { name: string; code: string | null } | null;
  commune: { name: string; code: string | null } | null;
};

export function AssociationHeroActions({
  association,
  regions,
  departements,
  communes,
}: {
  association: Association;
  regions: Region[];
  departements: Departement[];
  communes: Commune[];
}) {
  const [mode, setMode] = useState<"idle" | "info" | "password">("idle");

  if (mode === "info") {
    return (
      <div className="w-full mt-6">
        <AssociationInfoEditForm
          association={association}
          regions={regions}
          departements={departements}
          communes={communes}
          onClose={() => setMode("idle")}
        />
      </div>
    );
  }

  if (mode === "password") {
    return (
      <div className="w-full mt-6">
        <AssociationPasswordForm onClose={() => setMode("idle")} />
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2 sm:mt-0 sm:shrink-0 sm:flex-col sm:items-end">
      <button
        onClick={() => setMode("info")}
        className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
      >
        <Pencil className="h-4 w-4" aria-hidden />
        Modifier
      </button>
      <button
        onClick={() => setMode("password")}
        className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
      >
        <Lock className="h-4 w-4" aria-hidden />
        Mot de passe
      </button>
    </div>
  );
}
