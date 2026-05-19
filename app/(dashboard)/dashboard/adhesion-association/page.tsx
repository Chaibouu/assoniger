import { redirectAssociationSectionIndex } from "@/lib/association-section-index-redirect";

export default async function AdhesionAssociationIndexPage() {
  await redirectAssociationSectionIndex("demandes-adhesion");
}
