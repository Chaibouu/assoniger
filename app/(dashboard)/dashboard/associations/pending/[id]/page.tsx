import { getUser } from "@/actions/getUser";
import { fetchPendingAssociationById } from "@/actions/associations/pending-table";
import { PendingAssociationPendingDetailView } from "@/components/associations/PendingAssociationPendingDetailView";
import { AssociationStatus, UserRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

function isModerationStaff(role: UserRole) {
  return (
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.MODERATOR
  );
}

/**
 * Page serveur : contrôle d’accès + chargement des données, puis rendu délégué au composant d’affichage.
 */
export default async function PendingAssociationDetailPage({ params }: PageProps) {
  const { id } = await params;

  const result = await getUser();
  const currentUser = result?.user?.user;

  if (!currentUser) {
    redirect("/auth/login");
  }
  if (!isModerationStaff(currentUser.role)) {
    redirect("/unauthorized");
  }

  let detail;
  try {
    detail = await fetchPendingAssociationById(id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "Accès refusé") redirect("/unauthorized");
    redirect("/auth/login");
  }

  if (!detail) {
    notFound();
  }

  if (detail.status !== AssociationStatus.PENDING) {
    redirect(`/dashboard/associations/${id}`);
  }

  return <PendingAssociationPendingDetailView detail={detail} />;
}
