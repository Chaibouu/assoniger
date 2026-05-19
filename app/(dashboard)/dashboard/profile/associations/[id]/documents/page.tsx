import { redirectProfileAssociationNestedSection } from "@/lib/association-workspace-paths";

type PageProps = { params: Promise<{ id: string }> };

export default async function RedirectProfileAssociationDocumentsPage({ params }: PageProps) {
  const { id } = await params;
  await redirectProfileAssociationNestedSection(id, "documents");
}
