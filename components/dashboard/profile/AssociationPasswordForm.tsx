"use client";

import { useActionState, useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Lock, X, Check } from "lucide-react";
import { toast } from "sonner";
import { changeAssociationPasswordAction } from "@/actions/associations/update-association-profile";
import type { ProfileActionResult } from "@/actions/associations/update-association-profile";
import appConfig from "@/settings";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-foreground shadow-none outline-none transition-[border-color,box-shadow] focus:border-[#035740] focus:ring-2 focus:ring-[#035740]/15 placeholder:text-slate-400 disabled:opacity-50 pr-10";

const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";

function PasswordField({ id, name, label, placeholder, disabled }: {
  id: string; name: string; label: string; placeholder?: string; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className={labelClass} htmlFor={id}>{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder ?? "••••••••"}
          className={inputClass}
          disabled={disabled}
          required
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={show ? "Masquer" : "Afficher"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function AssociationPasswordForm({ onClose }: { onClose?: () => void } = {}) {
  const [open, setOpen] = useState(false);
  const isControlled = onClose !== undefined;
  const close = () => (isControlled ? onClose() : setOpen(false));

  const [result, action, pending] = useActionState<ProfileActionResult | null, FormData>(
    changeAssociationPasswordAction,
    null
  );

  useEffect(() => {
    if (!result) return;
    if (result.ok) {
      toast.success("Mot de passe modifié avec succès");
      close();
    } else {
      toast.error(result.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!isControlled && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/70"
      >
        <Lock className="h-3.5 w-3.5" aria-hidden />
        Changer le mot de passe
      </button>
    );
  }

  return (
    <form action={action} className="space-y-5 rounded-xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
      <div className="h-1 w-full rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Changer le mot de passe</h3>
        <button type="button" onClick={close} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <PasswordField id="currentPassword" name="currentPassword" label="Mot de passe actuel" disabled={pending} />
      <PasswordField id="newPassword" name="newPassword" label="Nouveau mot de passe" placeholder="Min. 8 caractères" disabled={pending} />
      <PasswordField id="confirmPassword" name="confirmPassword" label="Confirmer le nouveau mot de passe" disabled={pending} />

      <div className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={close}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/70"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: appConfig.primaryColor }}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
