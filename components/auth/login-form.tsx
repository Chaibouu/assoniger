"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import Image from "next/image";

import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { login } from "@/actions/login";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import appConfig from "@/settings";
import { cn } from "@/lib/utils";

const inputFieldClass =
  "h-11 min-h-11 rounded-lg border-slate-200 bg-white text-sm shadow-none transition-[border-color,box-shadow] focus-visible:border-[#035740] focus-visible:ring-2 focus-visible:ring-[#035740]/15 placeholder:text-slate-400";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Cet email est déjà utilisé avec un autre fournisseur."
      : "";

  const router = useRouter();

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      login({ ...values })
        .then((data) => {
          if (data?.error) setError(data.error);
          if (data?.success) {
            form.reset();
            setSuccess(data.success);
            router.push(callbackUrl);
          }
          if ((data as { twoFactor?: boolean })?.twoFactor) setShowTwoFactor(true);
        })
        .catch(() => setError("Une erreur est survenue. Réessayez."));
    });
  };

  return (
    <div className="flex flex-col bg-slate-50">

      {/* ── Header banner ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{ background: `linear-gradient(160deg, #024a36 0%, #035740 50%, #046347 80%, #053d2e 100%)` }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-8 left-1/3 h-40 w-40 rounded-full bg-[#E26E12]/10" />
          <div className="absolute top-0 right-1/4 h-full w-px bg-white/[0.06]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                Connexion
              </p>
              <h1 className="mt-1.5 text-2xl font-bold leading-tight text-white sm:text-3xl">
                {showTwoFactor ? "Vérification en deux étapes" : "Accéder à votre espace"}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/70">
                {showTwoFactor
                  ? "Saisissez le code à 6 chiffres généré par votre application d'authentification."
                  : "Connectez-vous pour gérer votre association, suivre vos dossiers et accéder à votre tableau de bord."}
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {[
                  "Tableau de bord association",
                  "Suivi de dossier en temps réel",
                  "Gestion des membres",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-xs text-white/75">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#E26E12]" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Logo */}
            <div className="hidden shrink-0 sm:flex sm:items-center sm:justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/95 shadow-lg">
                <Image
                  src={appConfig.logoUrl}
                  alt={appConfig.appName}
                  width={56}
                  height={56}
                  className="h-12 w-12 object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Barre décorative */}
        <div className="h-0.5 w-full bg-white/10" />
      </div>

      {/* ── Formulaire ── */}
      <div className="mx-auto w-full max-w-md px-5 py-10 sm:px-7 lg:px-8 lg:py-12">

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* 2FA */}
            {showTwoFactor && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Code de vérification
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="123456"
                        className={cn(inputFieldClass, "tracking-[0.3em] text-center text-lg font-semibold")}
                        maxLength={6}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Email + Mot de passe */}
            {!showTwoFactor && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">
                        Adresse email
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="contact@votre-association.ne"
                          type="email"
                          autoComplete="email"
                          className={inputFieldClass}
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
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-medium text-slate-700">
                          Mot de passe
                        </FormLabel>
                        <Link
                          href="/auth/forgot-password"
                          className="text-xs font-medium text-[#035740] hover:underline"
                        >
                          Mot de passe oublié ?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            disabled={isPending}
                            placeholder="Votre mot de passe"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className={cn(inputFieldClass, "pr-10")}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
                            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2.5 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="cursor-pointer"
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer text-sm font-normal text-slate-600">
                        Se souvenir de moi
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormError message={error || urlError} />
            <FormSuccess message={success} />

            <Button
              disabled={isPending}
              type="submit"
              className="h-11 w-full gap-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: appConfig.primaryColor }}
            >
              {isPending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {showTwoFactor ? "Vérification…" : "Connexion…"}
                </span>
              ) : (
                showTwoFactor ? "Confirmer le code" : "Se connecter"
              )}
            </Button>

            <p className="text-center text-sm text-slate-500">
              Pas encore de compte ?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-[#035740] hover:underline"
              >
                Créer un compte association
              </Link>
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
};
