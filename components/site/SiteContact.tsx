"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, Loader2 } from "lucide-react";
import appConfig from "@/settings";

type FormState = "idle" | "loading" | "success" | "error";

const inputCls =
  "w-full h-10 sm:h-11 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:bg-white focus:ring-2";

export function SiteContact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [state, setState] = useState<FormState>("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    await new Promise((res) => setTimeout(res, 1400));
    setState("success");
  };

  return (
    <section id="contact" className="w-full bg-gray-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-8 md:py-20 lg:py-28">

        {/* Section header */}
        <div className="mb-8 text-center md:mb-12">
          <span
            className="mb-3 inline-block text-xs font-bold uppercase tracking-widest"
            style={{ color: appConfig.primaryColor }}
          >
            Contact
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
            Rejoignez la plateforme
          </h2>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px w-12 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
            <div className="h-px w-12 rounded-full" style={{ backgroundColor: appConfig.primaryColor }} />
          </div>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-500">
            Créez votre espace en quelques minutes, publiez vos activités et rendez vos besoins
            visibles auprès des citoyens et partenaires du Niger.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl md:rounded-3xl">
          {/* Stack on mobile, side-by-side from sm (640px) */}
          <div className="flex flex-col sm:flex-row">

            {/* ── Left: info panel ── */}
            <div
              className="flex w-full flex-col p-5 sm:w-72 sm:shrink-0 sm:justify-between sm:p-6 lg:w-96 lg:p-10"
              style={{ backgroundColor: appConfig.secondaryColor }}
            >
              <div>
                <h3 className="text-base font-bold text-white sm:text-xl">Informations de contact</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                  Nous sommes disponibles pour répondre à toutes vos questions.
                </p>

                <ul className="mt-5 flex flex-col gap-4 sm:mt-8">
                  {[
                    { icon: Mail,   text: appConfig.contactEmail,   href: `mailto:${appConfig.contactEmail}` },
                    { icon: Phone,  text: appConfig.contactPhone,   href: `tel:${appConfig.contactPhone}` },
                    { icon: MapPin, text: appConfig.contactAddress, href: null },
                  ].map(({ icon: Icon, text, href }) => (
                    <li key={text} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15">
                        <Icon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {href ? (
                          <a
                            href={href}
                            className="block cursor-pointer break-all text-sm text-white/80 transition-colors duration-150 hover:text-white"
                          >
                            {text}
                          </a>
                        ) : (
                          <span className="block break-words text-sm text-white/80">{text}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTAs */}
              <div className="mt-6 flex flex-col gap-2.5 sm:mt-0">
                <Link
                  href="/auth/signup"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold transition-all duration-150 hover:bg-gray-100"
                  style={{ color: appConfig.secondaryColor }}
                >
                  Créer un compte gratuit
                </Link>
                <Link
                  href="/auth/login"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/30 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-white/10"
                >
                  Se connecter
                </Link>
              </div>
            </div>

            {/* ── Right: form ── */}
            <div className="min-w-0 flex-1 p-5 sm:p-6 md:p-8 lg:p-12">
              {state === "success" ? (
                <div className="flex h-full flex-col items-center justify-center gap-5 py-8 text-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${appConfig.primaryColor}15` }}
                  >
                    <CheckCircle2 className="h-8 w-8" style={{ color: appConfig.primaryColor }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">Message envoyé !</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Nous vous répondrons dans les meilleurs délais.
                    </p>
                  </div>
                  <button
                    onClick={() => { setForm({ name: "", email: "", subject: "", message: "" }); setState("idle"); }}
                    className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300"
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 sm:text-xl">Envoyer un message</h3>
                    <p className="mt-1 text-sm text-gray-500">Nous vous répondrons sous 24h.</p>
                  </div>

                  {/* Nom + Email */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">
                        Nom complet <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Votre nom"
                        className={inputCls}
                        style={{ "--tw-ring-color": `${appConfig.primaryColor}25` } as React.CSSProperties}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-600">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="votre@email.com"
                        className={inputCls}
                        style={{ "--tw-ring-color": `${appConfig.primaryColor}25` } as React.CSSProperties}
                      />
                    </div>
                  </div>

                  {/* Sujet */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">
                      Sujet <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className={inputCls}
                      style={{ "--tw-ring-color": `${appConfig.primaryColor}25` } as React.CSSProperties}
                    >
                      <option value="" disabled>Choisir un sujet…</option>
                      <option value="enregistrement">Enregistrement d&apos;une association</option>
                      <option value="information">Demande d&apos;information</option>
                      <option value="partenariat">Partenariat</option>
                      <option value="technique">Problème technique</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      placeholder="Décrivez votre demande…"
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-300 focus:bg-white focus:ring-2"
                      style={{ "--tw-ring-color": `${appConfig.primaryColor}25` } as React.CSSProperties}
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md transition-all duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    style={{ backgroundColor: appConfig.secondaryColor }}
                  >
                    {state === "loading" ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…</>
                    ) : (
                      <><Send className="h-4 w-4" /> Envoyer le message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
