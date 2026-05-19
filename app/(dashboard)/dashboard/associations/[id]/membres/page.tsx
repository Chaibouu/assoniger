import { redirectLegacyAssociationSection } from "@/lib/association-workspace-paths";

type PageProps = { params: Promise<{ id: string }> };

export default async function RedirectAssociationMembresPage({ params }: PageProps) {
  const { id } = await params;
  await redirectLegacyAssociationSection(id, "membres");
}
