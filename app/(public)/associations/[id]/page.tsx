import Link from "next/link";
import { notFound } from "next/navigation";
import { AssociationStatus } from "@prisma/client";
import {
  MapPin, Mail, Phone, Globe, Facebook, Twitter,
  Users, Calendar, Building2, HandHeart, ChevronLeft,
  ExternalLink, Tag, Landmark, ArrowRight, CheckCircle2,
  MessageCircle, Banknote, Coins, Info, Pencil, AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { db } from "@/lib/db";
import { ASSOCIATION_MEMBER_PENDING_POSITION } from "@/lib/association-member-kind";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getUser } from "@/actions/getUser";
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
    description: assoc.description?.slice(0, 160) || `Fiche de l'association ${assoc.name} sur ${appConfig.appName}`,
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  ACTIVE:    { label: "Active",     color: appConfig.primaryColor, bg: `${appConfig.primaryColor}20`, icon: CheckCircle2 },
  VERIFIED:  { label: "Vérifiée",   color: "#2563eb",              bg: "#dbeafe",                    icon: ShieldCheck },
  PENDING:   { label: "En attente", color: "#d97706",              bg: "#fef3c7",                    icon: AlertTriangle },
  REJECTED:  { label: "Rejetée",    color: "#dc2626",              bg: "#fee2e2",                    icon: AlertTriangle },
  SUSPENDED: { label: "Suspendue",  color: "#6b7280",              bg: "#f3f4f6",                    icon: AlertTriangle },
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

function fmtBudget(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency", currency: "XOF", maximumFractionDigits: 0,
  }).format(n);
}

export default async function AssociationPublicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* Détecte si le visiteur est le propriétaire de cette association */
  const authResult = await getUser().catch(() => null);
  const viewer = authResult?.user?.user ?? null;

  const association = await db.association.findFirst({
    where: { id, isDeleted: false },
    include: {
      region:      { select: { name: true, code: true } },
      departement: { select: { name: true } },
      commune:     { select: { name: true } },
      domains: {
        where: { isDeleted: false },
        include: { domain: { select: { name: true } } },
      },
      members: {
        // Les demandes d'adhésion en attente ne sont pas des membres : jamais affichées publiquement
        where: { isDeleted: false, position: { not: ASSOCIATION_MEMBER_PENDING_POSITION } },
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

  /* Page visible pour ACTIVE et VERIFIED ; PENDING visible uniquement par le propriétaire */
  const isOwner = !!viewer && viewer.id === association.userId;
  const isPubliclyVisible =
    association.status === AssociationStatus.ACTIVE ||
    association.status === AssociationStatus.VERIFIED;

  if (!isPubliclyVisible && !isOwner) notFound();

  const status = STATUS_CONFIG[association.status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;

  const location = [
    association.commune?.name,
    association.departement?.name,
    association.region?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const memberCount = association.totalMembers ?? association.members.length;
  const hasDescription = !!association.description?.trim();
  const hasContact =
    association.acceptPublicContact &&
    (association.contactEmail || association.contactPhone ||
     association.contactWhatsapp || association.website);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <SiteHeader />

      {/* Bandeau propriétaire — visible uniquement par le propriétaire */}
      {isOwner && (
        <div
          className="flex items-center justify-between gap-4 px-4 py-3 text-sm text-white md:px-8"
          style={{ backgroundColor: appConfig.secondaryColor }}
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>
              Vous consultez la fiche publique de votre association.
              {!hasDescription && (
                <strong className="ml-1">Votre description est vide — complétez-la pour attirer des membres.</strong>
              )}
            </span>
          </div>
          <Link
            href="/dashboard/profile"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 font-semibold transition-colors hover:bg-white/30"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier ma fiche
          </Link>
        </div>
      )}

      {/* Hero */}
      <div className="w-full" style={{ backgroundColor: appConfig.primaryColor }}>

        {/* Cover image */}
        {association.coverImageUrl && (
          <div className="relative h-40 w-full overflow-hidden md:h-56">
            <img
              src={association.coverImageUrl}
              alt=""
              className="h-full w-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 pb-0 pt-6 md:px-8 md:pt-8">
          {/* Breadcrumb */}
          <Link
            href="/associations"
            className="mb-8 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-white/70 transition-colors hover:text-white"
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
                    className="h-20 w-20 rounded-2xl border-4 border-white/20 object-cover shadow-xl md:h-28 md:w-28 md:rounded-3xl"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white/20 bg-white/15 text-2xl font-black text-white shadow-xl md:h-28 md:w-28 md:rounded-3xl md:text-4xl">
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
                    <StatusIcon className="h-3 w-3" />
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
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {association.website && (
                <a href={association.website} target="_blank" rel="noopener noreferrer"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white transition-all hover:bg-white/25"
                  aria-label="Site web"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {association.facebookPage && (
                <a href={association.facebookPage} target="_blank" rel="noopener noreferrer"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white transition-all hover:bg-white/25"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {association.twitterHandle && (
                <a href={`https://twitter.com/${association.twitterHandle}`} target="_blank" rel="noopener noreferrer"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white transition-all hover:bg-white/25"
                  aria-label="Twitter / X"
                >
                  <Twitter className="h-4 w-4" />
                </a>
              )}
              {association.contactWhatsapp && (
                <a href={`https://wa.me/${association.contactWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/10 text-white transition-all hover:bg-white/25"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Stats strip */}
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

            {/* About / Description */}
            <section className="rounded-2xl border border-gray-200 bg-white p-7">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${appConfig.primaryColor}15` }}>
                  <Info className="h-3.5 w-3.5" style={{ color: appConfig.primaryColor }} />
                </span>
                À propos
              </h2>
              {hasDescription ? (
                <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                  {association.description}
                </p>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Info className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Cette association n&apos;a pas encore renseigné sa description.
                  </p>
                  {isOwner && (
                    <Link
                      href="/dashboard/profile"
                      className="mt-1 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: appConfig.primaryColor }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Ajouter une description
                    </Link>
                  )}
                </div>
              )}
            </section>

            {/* Domains */}
            {association.domains.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-7">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${appConfig.primaryColor}15` }}>
                    <Tag className="h-3.5 w-3.5" style={{ color: appConfig.primaryColor }} />
                  </span>
                  Domaines d&apos;intervention
                </h2>
                <div className="flex flex-wrap gap-2">
                  {association.domains.map((item) => (
                    <span key={item.domainId}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3.5 py-1.5 text-sm font-medium text-gray-700"
                    >
                      {item.domain.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Funding sources */}
            {(association.annualBudget || association.fundingSources) && (
              <section className="rounded-2xl border border-gray-200 bg-white p-7">
                <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${appConfig.primaryColor}15` }}>
                    <Coins className="h-3.5 w-3.5" style={{ color: appConfig.primaryColor }} />
                  </span>
                  Ressources &amp; financement
                </h2>
                <div className="flex flex-col gap-4">
                  {association.annualBudget != null && (
                    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${appConfig.primaryColor}15` }}>
                        <Banknote className="h-4 w-4" style={{ color: appConfig.primaryColor }} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Budget annuel déclaré</p>
                        <p className="mt-0.5 text-base font-bold text-gray-800">
                          {fmtBudget(Number(association.annualBudget))}
                        </p>
                      </div>
                    </div>
                  )}
                  {association.fundingSources && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">Sources de financement</p>
                      <p className="text-sm leading-relaxed text-gray-600">{association.fundingSources}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Needs */}
            {association.needs.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-7">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${appConfig.secondaryColor}15` }}>
                      <HandHeart className="h-3.5 w-3.5" style={{ color: appConfig.secondaryColor }} />
                    </span>
                    Besoins en cours
                  </h2>
                  <span className="rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ backgroundColor: appConfig.secondaryColor }}>
                    {association.needs.length} actif{association.needs.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {association.needs.map((need) => (
                    <article key={need.id} className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{need.title}</h3>
                        <span className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
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

            {/* Members / bureau */}
            {association.displayMembersList && association.members.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-7">
                <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${appConfig.primaryColor}15` }}>
                    <Users className="h-3.5 w-3.5" style={{ color: appConfig.primaryColor }} />
                  </span>
                  Bureau &amp; équipe dirigeante
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {association.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: appConfig.primaryColor }}
                      >
                        {member.fullName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{member.fullName}</p>
                        {member.position && <p className="truncate text-xs text-gray-500">{member.position}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="order-1 flex flex-col gap-4 lg:order-2">

            {/* CTA join */}
            <div className="overflow-hidden rounded-2xl" style={{ backgroundColor: appConfig.primaryColor }}>
              {/* Déco */}
              <div className="relative px-5 pb-5 pt-5">
                <div className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/[0.06]" />
                <p className="relative text-base font-bold text-white">Rejoindre cette association</p>
                <p className="relative mt-1.5 text-xs leading-relaxed text-white/70">
                  Remplissez le formulaire de demande d&apos;adhésion. L&apos;association examinera votre dossier et vous contactera.
                </p>
                <Link
                  href={`/associations/${association.id}/rejoindre`}
                  className="relative mt-4 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-sm font-bold transition-all hover:opacity-90 hover:shadow-md"
                  style={{ color: appConfig.primaryColor }}
                >
                  <Users className="h-4 w-4" />
                  Faire une demande d&apos;adhésion
                </Link>
              </div>
              {/* Séparateur */}
              <div className="border-t border-white/15 px-5 py-3">
                <p className="text-center text-xs text-white/50">
                  Ou{" "}
                  <Link href="/auth/signup" className="font-semibold text-white/80 underline underline-offset-2 hover:text-white">
                    créez un compte
                  </Link>{" "}
                  pour accéder à plus de fonctionnalités.
                </p>
              </div>
            </div>

            {/* Infos légales */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Informations légales</h2>
              <dl className="flex flex-col gap-3.5">
                {([
                  { icon: Landmark, label: "Statut légal", value: LEGAL_STATUS_LABEL[association.legalStatus] ?? association.legalStatus },
                  association.receiptNumber ? { icon: Building2, label: "N° récépissé", value: association.receiptNumber } : null,
                  association.registrationNumber ? { icon: Tag, label: "N° enregistrement", value: association.registrationNumber } : null,
                  association.nif ? { icon: Tag, label: "NIF", value: association.nif } : null,
                  association.foundingDate ? {
                    icon: Calendar,
                    label: "Date de création",
                    value: new Date(association.foundingDate).toLocaleDateString("fr-FR", { year: "numeric", month: "long" }),
                  } : null,
                  association.verifiedAt ? {
                    icon: CheckCircle2,
                    label: "Vérifiée le",
                    value: new Date(association.verifiedAt).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }),
                  } : null,
                ] as const).filter(Boolean).map((item) => {
                  if (!item) return null;
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${appConfig.primaryColor}12` }}>
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

            {/* Effectifs */}
            {(association.totalMembers || association.totalVolunteers || association.totalStaff) && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">Effectifs</h2>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Membres", value: association.totalMembers, icon: Users },
                    { label: "Bénévoles", value: association.totalVolunteers, icon: HandHeart },
                    { label: "Salariés", value: association.totalStaff, icon: Building2 },
                  ].filter((r) => r.value != null && r.value > 0).map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between rounded-lg bg-gray-50 px-3.5 py-2.5">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon className="h-3.5 w-3.5 text-gray-400" />
                        {label}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact public */}
            {hasContact && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold text-gray-900">Contact</h2>
                <div className="flex flex-col gap-2">
                  {association.contactEmail && (
                    <a href={`mailto:${association.contactEmail}`}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-gray-200 hover:bg-white"
                    >
                      <Mail className="h-4 w-4 shrink-0" style={{ color: appConfig.primaryColor }} />
                      <span className="truncate text-xs text-gray-600">{association.contactEmail}</span>
                    </a>
                  )}
                  {association.contactPhone && (
                    <a href={`tel:${association.contactPhone}`}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-gray-200 hover:bg-white"
                    >
                      <Phone className="h-4 w-4 shrink-0" style={{ color: appConfig.primaryColor }} />
                      <span className="text-xs text-gray-600">{association.contactPhone}</span>
                    </a>
                  )}
                  {association.contactWhatsapp && (
                    <a href={`https://wa.me/${association.contactWhatsapp.replace(/\D/g, "")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-gray-200 hover:bg-white"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-xs text-gray-600">{association.contactWhatsapp}</span>
                    </a>
                  )}
                  {association.website && (
                    <a href={association.website} target="_blank" rel="noopener noreferrer"
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-colors hover:border-gray-200 hover:bg-white"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" style={{ color: appConfig.primaryColor }} />
                      <span className="truncate text-xs text-gray-600">{association.website}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Localisation */}
            {location && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h2 className="mb-3 text-sm font-semibold text-gray-900">Localisation</h2>
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${appConfig.primaryColor}12` }}>
                    <MapPin className="h-4 w-4" style={{ color: appConfig.primaryColor }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{location}</p>
                    {association.address && (
                      <p className="mt-1 text-xs text-gray-500">{association.address}</p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400">{association.country}</p>
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
