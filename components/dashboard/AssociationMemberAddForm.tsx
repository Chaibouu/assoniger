"use client";

import * as React from "react";
import appConfig from "@/settings";
import { FormSubmitButton } from "@/components/ui/form-submit-button";

type AssociationMemberAddFormProps = {
  associationId: string;
  addAction: (formData: FormData) => Promise<void>;
};

export function AssociationMemberAddForm({ associationId, addAction }: AssociationMemberAddFormProps) {
  const [memberKind, setMemberKind] = React.useState<"executive" | "simple">("executive");

  return (
    <form action={addAction} className="grid w-full gap-4">
      <input type="hidden" name="associationId" value={associationId} />
      <input type="hidden" name="memberKind" value={memberKind} />

      <fieldset className="space-y-3 rounded-lg border border-border/70 bg-muted/15 p-4">
        <legend className="text-sm font-semibold text-foreground">Type de membre</legend>
        <p className="text-xs text-muted-foreground">
          Le <strong>bureau exécutif</strong> regroupe les responsables (président, secrétaire, etc.). Les{" "}
          <strong>membres simples</strong> sont les adhérents sans fonction au bureau.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent p-2 has-[:checked]:border-primary/40 has-[:checked]:bg-background">
            <input
              type="radio"
              className="mt-1"
              checked={memberKind === "executive"}
              onChange={() => setMemberKind("executive")}
            />
            <span>
              <span className="block text-sm font-medium text-foreground">Membre du bureau exécutif</span>
              <span className="block text-xs text-muted-foreground">Indiquez la fonction officielle (ex. président).</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-transparent p-2 has-[:checked]:border-primary/40 has-[:checked]:bg-background">
            <input
              type="radio"
              className="mt-1"
              checked={memberKind === "simple"}
              onChange={() => setMemberKind("simple")}
            />
            <span>
              <span className="block text-sm font-medium text-foreground">Membre simple (adhérent)</span>
              <span className="block text-xs text-muted-foreground">Pas de poste au bureau exécutif.</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="fullName">
          Nom complet
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          minLength={2}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {memberKind === "executive" ? (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="executivePost">
            Fonction / poste au bureau <span className="text-destructive">*</span>
          </label>
          <input
            id="executivePost"
            name="executivePost"
            required={memberKind === "executive"}
            minLength={2}
            placeholder="Ex. Président, Secrétaire général, Trésorier…"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          Aucun poste au bureau ne sera enregistré pour ce profil.
        </p>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="phone">
          Téléphone (optionnel)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="email">
          E-mail (optionnel)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {memberKind === "executive" ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
          <input type="checkbox" name="isPrimary" className="h-4 w-4 rounded border-input" />
          Contact principal du bureau (affiché en priorité)
        </label>
      ) : null}

      <FormSubmitButton
        pendingLabel="Ajout en cours…"
        className="w-fit rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-70"
        style={{ backgroundColor: appConfig.primaryColor }}
      >
        {memberKind === "executive" ? "Ajouter au bureau exécutif" : "Ajouter le membre"}
      </FormSubmitButton>
    </form>
  );
}
