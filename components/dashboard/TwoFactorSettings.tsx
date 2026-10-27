"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Copy, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cancelTwoFactorSetup,
  confirmTwoFactorSetup,
  disableTwoFactor,
  startTwoFactorSetup,
} from "@/actions/two-factor";

type Step =
  | { kind: "idle" }
  | { kind: "setup"; qrCodeDataUrl: string; secret: string }
  | { kind: "disable" };

const codeInputProps = {
  inputMode: "numeric" as const,
  autoComplete: "one-time-code",
  maxLength: 6,
  placeholder: "123456",
  className: "h-11 max-w-[11rem] text-center text-lg tracking-[0.4em]",
};

export function TwoFactorSettings({ enabled, readOnly }: { enabled: boolean; readOnly?: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "idle" });
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setStep({ kind: "idle" });
    setCode("");
    setPassword("");
    setError("");
  };

  const onStart = () =>
    startTransition(async () => {
      setError("");
      setNotice("");
      const result = await startTwoFactorSetup();
      if (!result.ok) return setError(result.error);
      setStep({ kind: "setup", qrCodeDataUrl: result.qrCodeDataUrl, secret: result.secret });
    });

  const onConfirm = () =>
    startTransition(async () => {
      setError("");
      const result = await confirmTwoFactorSetup(code);
      if (!result.ok) return setError(result.error);
      reset();
      setNotice("Double authentification activée. Un code vous sera demandé à chaque connexion.");
      router.refresh();
    });

  const onCancelSetup = () =>
    startTransition(async () => {
      await cancelTwoFactorSetup();
      reset();
    });

  const onDisable = () =>
    startTransition(async () => {
      setError("");
      const result = await disableTwoFactor(password, code);
      if (!result.ok) return setError(result.error);
      reset();
      setNotice("Double authentification désactivée.");
      router.refresh();
    });

  const copySecret = async (secret: string) => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // presse-papiers indisponible : la clé reste lisible à l'écran
    }
  };

  if (readOnly) {
    return (
      <p className="text-sm text-muted-foreground">
        La double authentification ne peut pas être modifiée pendant une session d&apos;audit.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        {enabled ? (
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {enabled ? "Activée sur ce compte" : "Désactivée"}
          </p>
          <p className="mt-0.5 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {enabled
              ? "À chaque connexion, un code à 6 chiffres de votre application d'authentification est demandé en plus du mot de passe."
              : "Protégez votre compte : même avec votre mot de passe, personne ne pourra se connecter sans le code de votre téléphone (Google Authenticator, Microsoft Authenticator, Authy…)."}
          </p>
        </div>
      </div>

      {notice && (
        <p role="status" className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          {notice}
        </p>
      )}

      {/* ─── Activation ─────────────────────────────────────────────────── */}
      {!enabled && step.kind === "idle" && (
        <Button type="button" onClick={onStart} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          Activer la double authentification
        </Button>
      )}

      {!enabled && step.kind === "setup" && (
        <div className="space-y-5 border border-border p-4 sm:p-5">
          <ol className="space-y-5 text-sm">
            <li>
              <p className="font-medium text-foreground">1. Scannez ce QR code avec votre application</p>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- image data: générée côté serveur */}
                <img
                  src={step.qrCodeDataUrl}
                  alt="QR code à scanner avec votre application d'authentification"
                  width={180}
                  height={180}
                  className="h-[180px] w-[180px] border border-border bg-white p-2"
                />
                <div className="min-w-0 text-muted-foreground">
                  <p>Impossible de scanner ? Saisissez cette clé dans l&apos;application :</p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="break-all bg-muted px-2 py-1 font-mono text-xs text-foreground">
                      {step.secret}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copySecret(step.secret)}
                      aria-label="Copier la clé"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                    </Button>
                  </div>
                </div>
              </div>
            </li>
            <li>
              <label htmlFor="twofa-confirm-code" className="font-medium text-foreground">
                2. Saisissez le code à 6 chiffres affiché
              </label>
              <Input
                id="twofa-confirm-code"
                {...codeInputProps}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isPending}
                className={`mt-2 ${codeInputProps.className}`}
              />
            </li>
          </ol>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={onConfirm} disabled={isPending || code.trim().length < 6}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Confirmer l&apos;activation
            </Button>
            <Button type="button" variant="ghost" onClick={onCancelSetup} disabled={isPending}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* ─── Désactivation ──────────────────────────────────────────────── */}
      {enabled && step.kind === "idle" && (
        <Button type="button" variant="outline" onClick={() => setStep({ kind: "disable" })}>
          Désactiver
        </Button>
      )}

      {enabled && step.kind === "disable" && (
        <div className="space-y-4 border border-border p-4 sm:p-5">
          <p className="text-sm text-muted-foreground">
            Pour désactiver la double authentification, confirmez votre mot de passe et un code de votre application.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="twofa-disable-password" className="text-sm font-medium text-foreground">
                Mot de passe
              </label>
              <Input
                id="twofa-disable-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="mt-1.5 h-11"
              />
            </div>
            <div>
              <label htmlFor="twofa-disable-code" className="text-sm font-medium text-foreground">
                Code de l&apos;application
              </label>
              <Input
                id="twofa-disable-code"
                {...codeInputProps}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isPending}
                className={`mt-1.5 ${codeInputProps.className}`}
              />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={onDisable}
              disabled={isPending || !password || code.trim().length < 6}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Désactiver la double authentification
            </Button>
            <Button type="button" variant="ghost" onClick={reset} disabled={isPending}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
