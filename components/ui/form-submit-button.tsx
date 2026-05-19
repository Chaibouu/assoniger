"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FormSubmitButtonProps = ButtonProps & {
  /** Texte affiché pendant l’envoi (à côté du spinner). */
  pendingLabel?: string;
};

/**
 * Bouton `submit` lié à l’état d’une action serveur sur le formulaire parent :
 * désactivé + loader pendant `pending` (évite les doubles clics).
 * Doit être rendu **à l’intérieur** du `<form>` concerné.
 */
export function FormSubmitButton({
  children,
  pendingLabel = "Envoi en cours…",
  className,
  disabled,
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      {...props}
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={cn("gap-2", className)}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
