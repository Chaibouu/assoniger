import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, CheckCircle2, MapPin, Users, ShieldCheck,
  Calendar, UserPlus,
} from "lucide-react";
import { AssociationStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getUser } from "@/actions/getUser";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { JoinRequestForm } from "@/components/associations/JoinRequestForm";
import appConfig from "@/settings";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assoc = await db.association.findFirst({
    where: { id, isDeleted: false },
    select: { name: true },
  });
  return assoc
    ? { title: `Rejoindre ${assoc.name} — ${appConfig.appName}` }
    : {};
}

export default async function JoinAssociationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* Association publiquement accessible */
  const association = await db.association.findFirst({
    where: {
      id,
      isDeleted: false,
      status: { in: [AssociationStatus.ACTIVE, AssociationStatus.VERIFIED] },
    },
    select: {
      id: true, name: true, acronym: true, logoUrl: true, slogan: true,
      description: true, totalMembers: true, foundingDate: true,
      status: true, verifiedAt: true,
      region: { select: { name: true } },
      departement: { select: { name: true } },
      commune: { select: { name: true } },
    },
  });

  if (!association) notFound();

  /* Si c'est le propriétaire de l'association, on le redirige */
  const authResult = await getUser().catch(() => null);
  const viewer = authResult?.user?.user ?? null;

  /* Pré-remplissage si utilisateur connecté */
  const defaultName = viewer?.name ?? "";
  const defaultEmail = viewer?.email ?? "";

  const location = [
    association.commune?.name,
    association.departement?.name,
    association.region?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const descriptionSnippet = association.description?.trim().slice(0, 180);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <SiteHeader />

      {/* ── Bannière verte ── */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          background: `linear-gradient(160deg, #024a36 0%, #035740 55%, #046347 80%, #053d2e 100%)`,
        }}
      >
        {/* Décorations */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-12 -right-12 h-56 w-56 rounded-full bg-white/[0.04]" />
          <div className="absolute -bottom-10 left-1/4 h-40 w-40 rounded-full bg-[#E26E12]/10" />
          <div className="absolute top-0 right-1/3 h-full w-px bg-white/[0.05]" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          {/* Retour */}
          <Link
            href={`/associations/${id}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour à la fiche
          </Link>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Texte gauche */}
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                Demande d&apos;adhésion
              </p>
              <h1 className="mt-1.5 text-2xl font-bold leading-tight text-white sm:text-3xl">
                Rejoindre{" "}
                <span style={{ color: "#E26E12" }}>
                  {association.acronym ?? association.name}
                </span>
              </h1>
              {association.slogan && (
                <p className="mt-1.5 text-sm italic text-white/60">
                  &ldquo;{association.slogan}&rdquo;
                </p>
              )}
              {descriptionSnippet && (
                <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">
                  {descriptionSnippet}
                  {(association.description?.length ?? 0) > 180 ? "…" : ""}
                </p>
              )}

              {/* Meta infos */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {association.status === AssociationStatus.ACTIVE && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Active
                  </span>
                )}
                {association.status === AssociationStatus.VERIFIED && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-200">
                    <ShieldCheck className="h-3 w-3" /> Vérifiée
                  </span>
                )}
                {location && (
                  <span className="flex items-center gap-1.5 text-xs text-white/70">
                    <MapPin className="h-3.5 w-3.5" /> {location}
                  </span>
                )}
                {association.totalMembers ? (
                  <span className="flex items-center gap-1.5 text-xs text-white/70">
                    <Users className="h-3.5 w-3.5" /> {association.totalMembers} membres
                  </span>
                ) : null}
                {association.foundingDate && (
                  <span className="flex items-center gap-1.5 text-xs text-white/70">
                    <Calendar className="h-3.5 w-3.5" />
                    Fondée en {new Date(association.foundingDate).getFullYear()}
                  </span>
                )}
              </div>

              {/* Points clés */}
              <ul className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
                {[
                  "Demande gratuite et sans engagement",
                  "Réponse de l'association sous 48h",
                  "Vos données restent confidentielles",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-1.5 text-xs text-white/75">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#E26E12]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Logo / avatar droite */}
            <div className="hidden shrink-0 sm:flex sm:items-center sm:justify-center">
              {association.logoUrl ? (
                <img
                  src={association.logoUrl}
                  alt={association.name}
                  className="h-24 w-24 rounded-3xl border-4 border-white/20 object-cover shadow-2xl"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white/20 bg-white/15 text-3xl font-black text-white shadow-2xl">
                  {association.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Barre décorative basse */}
        <div className="h-0.5 w-full bg-white/10" />
      </div>

      {/* ── Formulaire ── */}
      <div className="mx-auto w-full max-w-lg px-5 py-10 sm:px-7">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header formulaire */}
          <div
            className="flex items-center gap-3 border-b border-slate-100 px-6 py-4"
            style={{ backgroundColor: `${appConfig.primaryColor}08` }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${appConfig.primaryColor}18` }}
            >
              <UserPlus className="h-4 w-4" style={{ color: appConfig.primaryColor }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Formulaire de demande</p>
              <p className="text-xs text-slate-500">
                {association.name}
              </p>
            </div>
          </div>

          <div className="px-6 py-6">
            <JoinRequestForm
              associationId={association.id}
              associationName={association.name}
              defaultName={defaultName}
              defaultEmail={defaultEmail}
            />
          </div>
        </div>

        {/* Lien connexion */}
        {!viewer && (
          <p className="mt-5 text-center text-sm text-slate-500">
            Vous avez déjà un compte ?{" "}
            <Link
              href={`/auth/login?callbackUrl=/associations/${id}/rejoindre`}
              className="font-semibold underline underline-offset-2"
              style={{ color: appConfig.primaryColor }}
            >
              Se connecter
            </Link>{" "}
            pour pré-remplir le formulaire.
          </p>
        )}
      </div>

      <div className="flex-1" />
      <SiteFooter />
    </div>
  );
}
