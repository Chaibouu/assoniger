"use client";

import { useActionState, useEffect, useState } from "react";
import { User, Mail, Phone, MessageSquare, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { requestMembershipAction } from "@/actions/associations/request-membership";
import type { MembershipRequestResult } from "@/actions/associations/request-membership";
import appConfig from "@/settings";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-none outline-none transition-[border-color,box-shadow] placeholder:text-slate-400 focus:border-[#035740] focus:ring-2 focus:ring-[#035740]/15 disabled:opacity-50";

const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

type Props = {
  associationId: string;
  associationName: string;
  defaultName?: string;
  defaultEmail?: string;
  defaultPhone?: string;
};

export function JoinRequestForm({
  associationId,
  associationName,
  defaultName = "",
  defaultEmail = "",
  defaultPhone = "",
}: Props) {
  const [result, action, pending] = useActionState<MembershipRequestResult | null, FormData>(
    requestMembershipAction,
    null
  );

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (result?.ok) setSubmitted(true);
  }, [result]);

  /* ── Succès ── */
  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 py-10 text-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${appConfig.primaryColor}18` }}
        >
          <CheckCircle2 className="h-10 w-10" style={{ color: appConfig.primaryColor }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Demande envoyée !</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
            Votre demande d&apos;adhésion à <strong>{associationName}</strong> a bien été reçue.
            L&apos;association examinera votre dossier et vous contactera prochainement.
          </p>
        </div>
        <Link
          href={`/associations/${associationId}`}
          className="mt-2 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: appConfig.primaryColor }}
        >
          Retour à la fiche
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  /* ── Formulaire ── */
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="associationId" value={associationId} />

      {/* Nom complet */}
      <div>
        <label className={labelClass} htmlFor="jrf-fullName">
          Nom complet <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="jrf-fullName"
            name="fullName"
            type="text"
            placeholder="Prénom et nom"
            defaultValue={defaultName}
            required
            disabled={pending}
            className={`${inputClass} pl-10`}
            autoComplete="name"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className={labelClass} htmlFor="jrf-email">
          Adresse email <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="jrf-email"
            name="email"
            type="email"
            placeholder="votre@email.com"
            defaultValue={defaultEmail}
            required
            disabled={pending}
            className={`${inputClass} pl-10`}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Téléphone */}
      <div>
        <label className={labelClass} htmlFor="jrf-phone">
          Numéro de téléphone <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="jrf-phone"
            name="phone"
            type="tel"
            placeholder="+227 XX XX XX XX"
            defaultValue={defaultPhone}
            required
            disabled={pending}
            className={`${inputClass} pl-10`}
            autoComplete="tel"
          />
        </div>
      </div>

      {/* Motivation */}
      <div>
        <label className={labelClass} htmlFor="jrf-motivation">
          Message de motivation{" "}
          <span className="text-xs font-normal text-slate-400">(facultatif)</span>
        </label>
        <div className="relative">
          <MessageSquare className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <textarea
            id="jrf-motivation"
            name="motivation"
            rows={4}
            placeholder="Pourquoi souhaitez-vous rejoindre cette association ? Quelles compétences pouvez-vous apporter ?"
            disabled={pending}
            className={`${inputClass} pl-10 resize-none`}
            maxLength={1000}
          />
        </div>
      </div>

      {/* Erreur serveur */}
      {result && !result.ok && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      {/* Soumettre */}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: appConfig.primaryColor }}
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Envoi en cours…
          </>
        ) : (
          <>
            Envoyer ma demande
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-slate-400">
        Vos informations seront transmises uniquement à l&apos;association et ne seront pas
        rendues publiques.
      </p>
    </form>
  );
}
