import Link from "next/link";
import { notFound } from "next/navigation";
import { AssociationStatus } from "@prisma/client";
import {
  MapPin, Mail, Phone, Globe, Facebook, Twitter,
  Users, Calendar, Building2, HandHeart, ChevronLeft,
  ExternalLink, Tag, Landmark, ArrowRight, CheckCircle2,
} from "lucide-react";
import { db } from "@/lib/db";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import appConfig from "@/settings";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const assoc = await db.association.findFirst({
    where: { id, isDeleted: false },
    select: { name: true, description: true },
  });
  if (!assoc) return {};
  return {
    title: `${assoc.name} — ${appConfig.appName}`,
    description: assoc.description?.slice(0, 160),
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:    { label: "Active",     color: appConfig.primaryColor, bg: `${appConfig.primaryColor}18` },
  VERIFIED:  { label: "Vérifiée",   color: "#2563eb",              bg: "#eff6ff" },
  PENDING:   { label: "En attente", color: "#d97706",              bg: "#fffbeb" },
  REJECTED:  { label: "Rejetée",    color: "#dc2626",              bg: "#fef2f2" },
  SUSPENDED: { label: "Suspendue",  color: "#6b7280",              bg: "#f3f4f6" },
};

const LEGAL_STATUS_LABEL: Record<string, string> = {
  DECLARED: "Déclarée",
  PUBLIC_UTILITY: "Utilité publique",
  COOPERATIVE: "Coopérative",
  FOUNDATION: "Fondation",
  OTHER: "Autre",
};

const NEED_TYPE_LABEL: Record<string, string> = {
  MATERIAL: "Matériel",
  FINANCIAL: "Financier",
  VOLUNTEER: "Bénévolat",
  SERVICE: "Service",
  OTHER: "Autre",
};

export default async function AssociationPublicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const association = await db.association.findFirst({
    where: {
      id,
      isDeleted: false,
      status: { in: [AssociationStatus.ACTIVE, AssociationStatus.VERIFIED] },
    },
    include: {
      region:      { select: { name: true, code: true } },
      departement: { select: { name: true } },
      commune:     { select: { name: true } },
      domains: {
        where: { isDeleted: false },
        include: { domain: { select: { name: true } } },
      },
      members: {
        where: { isDeleted: false },
        orderBy: { createdAt: "asc" },
      },
      needs: {
        where: { status: "OPEN", isDeleted: false },
        take: 6,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!association) notFound();

  const status = STATUS_CONFIG[association.status] ?? STATUS_CONFIG.PENDING;
  const location = [
    association.commune?.name,
    association.departement?.name,
    association.region?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const memberCount = association.totalMembers ?? association.members.length;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      {/* Hero */}
      <div className="w-full" style={{ backgroundColor: appConfig.primaryColor }}>
        <div className="mx-auto max-w-7xl px-4 pb-0 pt-6 md:px-8 md:pt-8">
          {/* Breadcrumb */}
          <Link
            href="/associations"
            className="mb-8 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-white/70 transition-colors duration-150 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour à l&apos;annuaire
          </Link>

          {/* Association identity */}
          <div className="flex flex-col gap-8 pb-10 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-5">
              {/* Logo / Avatar */}
              <div className="shrink-0">
                {association.logoUrl ? (
                  <img
                    src={association.logoUrl}
                    alt={association.name}
                    className="h-16 w-16 rounded-2xl border-4 border-white/20 object-cover shadow-xl md:h-24 md:w-24 md:rounded-3xl"
                  />
                ) : (
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white/20 bg-white/15 text-2xl font-black text-white shadow-xl md:h-24 md:w-24 md:rounded-3xl md:text-3xl"
                  >
                    {association.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-bold leading-snug text-white md:text-3xl">
                    {association.name}
                  </h1>
                  {association.acronym && (
                    <span className="rounded-lg border border-white/30 bg-white/15 px-2.5 py-1 text-xs font-bold text-white">
                      {association.acronym}
                    </span>
                  )}
                </div>

                {association.slogan && (
                  <p className="mt-2 text-sm italic text-white/70">&ldquo;{association.slogan}&rdquo;</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                    style={{ backgroundColor: status.bg, color: status.color }}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {status.label}
                  </span>
                  {location && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                      <MapPin className="h-3.5 w-3.5" />
                      {location}
                    </span>
                  )}
                  {association.foundingDate && (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-white/80">
                      <Calendar className="h-3.5 w-3.5" />
                      Fondée en {new Date(association.foundingDate).getFullYear()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Social links */}
            <div className="flex shrink-0 items-center gap-2">
              {association.website && (
                <a
                  href={association.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white transition-all duration-150 hover:bg-white/20 hover:scale-105"
                  aria-label="Site web"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {association.facebookPage && (
                <a
                  href={association.facebookPage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white transition-all duration-150 hover:bg-white/20 hover:scale-105"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {association.twitterHandle && (
                <a
                  href={`https://twitter.com/${association.twitterHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white transition-all duration-150 hover:bg-white/20 hover:scale-105"
                  aria-label="Twitter / X"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Stats strip — overlapping white card */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-t-2xl border border-white/20 bg-white/20 sm:grid-cols-4">
            {[
              { label: "Membres", value: memberCount || "—", icon: Users },
              { label: "Domaines", value: association.domains.length || "—", icon: Tag },
              { label: "Besoins actifs", value: association.needs.length || "0", icon: HandHeart },
              { label: "Bénévoles", value: association.totalVolunteers || "—", icon: CheckCircle2 },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 bg-white/10 px-5 py-4 backdrop-blur-sm">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15">
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">{stat.value}</p>
                  <p className="text-[11px] font-medium text-white/60">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">

          {/* Left column */}
          <div className="order-2 flex flex-col gap-5 lg:order-1">

            {/* About */}
            <section className="rounded-2xl border border-gray-200 bg-white p-7">
              <h2 className="mb-4 text-base font-semibold text-gray-900">À propos</h2>
              <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                {association.description}
              </p>
            </section>

            {/* Domains */}
            {association.domains.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-7">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${appConfig.primaryColor}15` }}
                  >
                    <Tag className="h-3.5 w-3.5" style={{ color: appConfig.primaryColor }} />
                  </span>
                  Domaines d&apos;intervention
                </h2>
                <div className="flex flex-wrap gap-2">
                  {association.domains.map((item) => (
                    <span
                      key={item.domainId}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-sm font-medium text-gray-700"
                    >
                      {item.domain.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Needs */}
            {association.needs.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-7">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${appConfig.secondaryColor}15` }}
                    >
                      <HandHeart className="h-3.5 w-3.5" style={{ color: appConfig.secondaryColor }} />
                    </span>
                    Besoins en cours
                  </h2>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-bold text-white"
                    style={{ backgroundColor: appConfig.secondaryColor }}
                  >
                    {association.needs.length} actif{association.needs.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {association.needs.map((need) => (
                    <article
                      key={need.id}
                      className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{need.title}</h3>
                        <span
                          className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                          style={{ backgroundColor: appConfig.secondaryColor }}
                        >
                          {NEED_TYPE_LABEL[need.needType] ?? need.needType}
                        </span>
                      </div>
                      {need.description && (
                        <p className="text-xs leading-relaxed text-gray-500">{need.description}</p>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* Members */}
            {association.displayMembersList && association.members.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-7">
                <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${appConfig.primaryColor}15` }}
                  >
                    <Users className="h-3.5 w-3.5" style={{ color: appConfig.primaryColor }} />
                  </span>
                  Bureau &amp; équipe dirigeante
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {association.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: appConfig.primaryColor }}
                      >
                        {member.fullName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {member.fullName}
                        </p>
                        {member.position && (
                          <p className="truncate text-xs text-gray-500">{member.position}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="order-1 flex flex-col gap-4 lg:order-2">

            {/* CTA join — prominent at top */}
            <div
              className="rounded-2xl p-5"
              style={{ backgroundColor: appConfig.primaryColor }}
            >
              <p className="text-base font-bold text-white">Rejoindre cette association</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/70">
                Créez un compte pour demander à rejoindre cette association ou la soutenir.
              </p>
              <Link
                href="/auth/signup"
                className="mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-sm font-bold transition-opacity duration-150 hover:opacity-90"
                style={{ color: appConfig.primaryColor }}
              >
                Créer un compte
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Key info */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Informations légales</h2>
              <dl className="flex flex-col gap-3.5">
                {([
                  { icon: Landmark, label: "Statut légal", value: LEGAL_STATUS_LABEL[association.legalStatus] ?? association.legalStatus },
                  association.receiptNumber ? { icon: Building2, label: "N° récépissé", value: association.receiptNumber } : null,
                  association.registrationNumber ? { icon: Tag, label: "N° enregistrement", value: association.registrationNumber } : null,
                  association.foundingDate ? { icon: Calendar, label: "Date de création", value: new Date(association.foundingDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }) } : null,
                ] as const).filter(Boolean).map((item) => {
                  if (!item) return null;
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${appConfig.primaryColor}12` }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: appConfig.primaryColor }} />
                      </div>
                      <div>
                        <dt className="text-[11px] text-gray-400">{item.label}</dt>
                        <dd className="mt-0.5 text-sm font-medium text-gray-700">{item.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            </div>

            {/* Contact */}
            {association.acceptPublicContact && (
              association.contactEmail || association.contactPhone || association.website
            ) && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">Contact public</h2>
                <div className="flex flex-col gap-2">
                  {association.contactEmail && (
                    <a
                      href={`mailto:${association.contactEmail}`}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600 transition-colors duration-150 hover:border-gray-200 hover:bg-white"
                    >
                      <Mail className="h-4 w-4 shrink-0" style={{ color: appConfig.primaryColor }} />
                      <span className="truncate text-xs">{association.contactEmail}</span>
                    </a>
                  )}
                  {association.contactPhone && (
                    <a
                      href={`tel:${association.contactPhone}`}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600 transition-colors duration-150 hover:border-gray-200 hover:bg-white"
                    >
                      <Phone className="h-4 w-4 shrink-0" style={{ color: appConfig.primaryColor }} />
                      <span className="text-xs">{association.contactPhone}</span>
                    </a>
                  )}
                  {association.website && (
                    <a
                      href={association.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600 transition-colors duration-150 hover:border-gray-200 hover:bg-white"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" style={{ color: appConfig.primaryColor }} />
                      <span className="truncate text-xs">{association.website}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {location && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">Localisation</h2>
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${appConfig.primaryColor}12` }}
                  >
                    <MapPin className="h-4 w-4" style={{ color: appConfig.primaryColor }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{location}</p>
                    {association.address && (
                      <p className="mt-1 text-xs text-gray-500">{association.address}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
