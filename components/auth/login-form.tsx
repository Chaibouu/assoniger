"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { cancelTwoFactorLogin, login, verifyTwoFactorLogin } from "@/actions/login";
import { cn } from "@/lib/utils";
import appConfig from "@/settings";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import {
  authBannerGradient,
  authBrandVars,
  authInputClass,
  authLinkClass,
  authPrimaryButtonClass,
} from "@/components/auth/auth-theme";

/** Erreurs renvoyées dans l'URL (?error=…), notamment au retour de la connexion Google. */
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked: "Cet email est déjà utilisé avec un autre mode de connexion.",
  google_no_account:
    "Aucun compte n'est associé à cette adresse Google. Inscrivez d'abord votre association, puis connectez-vous avec la même adresse.",
  google_cancelled: "Connexion avec Google annulée.",
  google_expired: "La connexion avec Google a expiré. Réessayez.",
  google_failed: "La connexion avec Google a échoué. Réessayez dans un instant.",
  google_email_unverified: "Votre adresse Google n'est pas vérifiée : connectez-vous avec votre mot de passe.",
  google_unavailable: "La connexion avec Google n'est pas disponible pour le moment.",
  account_pending:
    "Votre compte est en attente de validation. Vous serez notifié dès qu'il sera activé.",
  account_disabled: "Votre compte est désactivé. Contactez l'administrateur.",
};

/** Logo « G » officiel de Google (couleurs de la charte). */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export const LoginForm = () => {
  const searchParams = useSearchParams();
  // Uniquement un chemin interne (évite la redirection vers un site externe après connexion)
  const rawCallbackUrl = searchParams.get("callbackUrl") ?? "";
  const callbackUrl =
    rawCallbackUrl.startsWith("/") && !rawCallbackUrl.startsWith("//") && !rawCallbackUrl.includes("\\")
      ? rawCallbackUrl
      : DEFAULT_LOGIN_REDIRECT; // tableau de bord par défaut après connexion
  const urlError = LOGIN_ERROR_MESSAGES[searchParams.get("error") ?? ""] ?? "";

  const router = useRouter();

  // Retour de Google avec la 2FA activée : on reprend directement à l'étape du code
  const [showTwoFactor, setShowTwoFactor] = useState(searchParams.get("twoFactor") === "1");
  const [showPassword, setShowPassword] = useState(false);
  /** Clic sur « Continuer avec Google » : la page part vers Google, on affiche l'attente. */
  const [googleRedirecting, setGoogleRedirecting] = useState(false);

  // Retour arrière depuis Google (cache de page du navigateur) : réactiver le bouton
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setGoogleRedirecting(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // « Rester connecté » s'applique aussi à la connexion Google (transmis dans le lien)
  const rememberMe = form.watch("rememberMe");

  /** Retour au formulaire email / mot de passe (abandon ou expiration de l'étape 2FA). */
  const resetTwoFactorStep = () => {
    setShowTwoFactor(false);
    form.setValue("code", "");
  };

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      // Étape 2 : code de l'application d'authentification
      if (showTwoFactor) {
        verifyTwoFactorLogin(values.code ?? "")
          .then((data) => {
            if (data?.error) {
              setError(data.error);
              if ("expired" in data && data.expired) resetTwoFactorStep();
              return;
            }
            if (data?.success) {
              form.reset();
              setSuccess(data.success);
              router.push(callbackUrl); // Redirection après succès
            }
          })
          .catch(() => setError("Une erreur est survenue"));
        return;
      }

      // Étape 1 : email / mot de passe
      login({ ...values })
        .then((data) => {
          if (data?.error) {
            setError(data.error);
            return;
          }

          if (data && "requires2FA" in data && data.requires2FA) {
            setShowTwoFactor(true);
            return;
          }

          if (data?.success) {
            form.reset();
            setSuccess(data.success);
            router.push(callbackUrl); // Redirection après succès
          }
        })
        .catch(() => setError("Une erreur est survenue"));
    });
  };

  const onCancelTwoFactor = () => {
    setError("");
    startTransition(() => {
      cancelTwoFactorLogin().finally(resetTwoFactorStep);
    });
  };

  return (
    <div
      id="login-scroll"
      className="h-full overflow-y-auto overscroll-y-contain bg-[#F5F2EC] selection:bg-[var(--brand)] selection:text-white"
      style={authBrandVars}
    >
      {/* Mobile : carte en haut (reste visible clavier ouvert) ; à partir de sm : centrée verticalement */}
      <div className="mx-auto flex min-h-full w-full max-w-[30rem] flex-col justify-start px-3 py-5 sm:justify-center sm:py-12">
        <div className="overflow-hidden bg-white shadow-[0_28px_70px_-32px_rgba(3,40,28,0.45)] ring-1 ring-black/5">
          {/* ─── Bandeau ─────────────────────────────────────────────────────── */}
          <header className="relative isolate overflow-hidden">
            <Image
              src="/background.png"
              alt=""
              fill
              priority
              sizes="(min-width: 480px) 480px, 100vw"
              className="-z-20 object-cover object-[center_60%]"
            />
            <div aria-hidden className="absolute inset-0 -z-10" style={{ background: authBannerGradient }} />
            <div className="flex items-center gap-4 px-6 py-8 sm:px-8">
              <div className="shrink-0 rounded-xl bg-white p-1.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)]">
                <Image
                  src={appConfig.logoUrl}
                  alt={appConfig.appName}
                  width={64}
                  height={64}
                  className="h-14 w-14 object-contain"
                  priority
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-balance text-2xl font-bold leading-tight tracking-tight text-white sm:text-[1.75rem]">
                  {showTwoFactor ? "Vérification en deux étapes" : "Connexion"}
                </h1>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-white/90">
                  {showTwoFactor
                    ? "Une dernière étape pour sécuriser votre accès."
                    : "Accédez à l'espace de gestion de votre association."}
                </p>
              </div>
            </div>
          </header>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 py-7 sm:px-8" noValidate>
              {showTwoFactor ? (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <div className="mb-1 flex items-start gap-3 border border-border bg-[var(--brand-tint)] p-3.5">
                        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[var(--brand)]" aria-hidden />
                        <FormDescription className="text-sm leading-relaxed text-foreground/80">
                          Ouvrez votre application d&apos;authentification et saisissez le code à 6 chiffres
                          affiché pour {appConfig.appName}.
                        </FormDescription>
                      </div>
                      <FormLabel className="text-sm font-medium text-foreground">Code de vérification</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={isPending}
                          placeholder="123456"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          autoFocus
                          className={cn(authInputClass, "h-12 text-center text-lg tracking-[0.5em]")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Adresse email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="contact@votre-association.ne"
                            type="email"
                            autoComplete="email"
                            className={authInputClass}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Mot de passe</FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isPending}
                              placeholder="Votre mot de passe"
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              className={cn(authInputClass, "pr-11")}
                            />
                          </FormControl>
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                            aria-pressed={showPassword}
                            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:text-[var(--brand)]"
                          >
                            {showPassword ? (
                              <EyeOff className="h-[18px] w-[18px]" aria-hidden />
                            ) : (
                              <Eye className="h-[18px] w-[18px]" aria-hidden />
                            )}
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-2.5 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                              className="h-[18px] w-[18px] border-input data-[state=checked]:border-[var(--brand)] data-[state=checked]:bg-[var(--brand)] data-[state=checked]:text-white focus-visible:ring-[var(--brand-ring)]"
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer text-sm font-normal text-foreground/80">
                            Rester connecté
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <Link href="/auth/forgot-password" className={cn(authLinkClass, "text-sm")}>
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </>
              )}

              <FormError message={error || urlError} />
              <FormSuccess message={success} />

              <Button disabled={isPending} type="submit" className={cn(authPrimaryButtonClass, "w-full")}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {showTwoFactor ? "Vérification…" : "Connexion…"}
                  </>
                ) : (
                  <>
                    {showTwoFactor ? "Vérifier" : "Se connecter"}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </Button>

              {showTwoFactor && (
                <Button
                  type="button"
                  variant="link"
                  disabled={isPending}
                  onClick={onCancelTwoFactor}
                  className="h-auto w-full p-0 font-normal text-muted-foreground"
                >
                  Retour à la connexion
                </Button>
              )}

              {/* Connexion Google désactivée pour l'instant (URI de retour à déclarer dans la console
                  Google Cloud). Pour la réactiver, décommenter ce bloc :

              {!showTwoFactor && (
                <>
                  <div className="flex items-center gap-3" aria-hidden>
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-xs text-muted-foreground">ou</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <a
                    href={`/api/auth/google?remember=${rememberMe ? "1" : "0"}&callbackUrl=${encodeURIComponent(callbackUrl)}`}
                    onClick={() => setGoogleRedirecting(true)}
                    aria-disabled={isPending || googleRedirecting}
                    aria-busy={googleRedirecting}
                    className={cn(
                      "flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-input bg-white px-4",
                      "text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
                      "transition-[background-color,border-color,box-shadow] hover:border-foreground/25 hover:bg-muted/40",
                      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--brand-ring)]",
                      isPending && "pointer-events-none opacity-60",
                      googleRedirecting && "pointer-events-none bg-muted/40"
                    )}
                  >
                    {googleRedirecting ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
                    ) : (
                      <GoogleIcon />
                    )}
                    {googleRedirecting ? "Redirection vers Google…" : "Continuer avec Google"}
                  </a>
                </>
              )}
              */}
            </form>
          </Form>

          <footer className="border-t border-border bg-[#FBFAF7] px-6 py-5 text-center text-sm text-muted-foreground sm:px-8">
            Votre association n&apos;est pas encore inscrite ?{" "}
            <Link href="/auth/signup" className={cn(authLinkClass, "whitespace-nowrap")}>
              Inscrire une association
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
};
