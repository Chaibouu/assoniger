import { redirectAssociationSectionIndex } from "@/lib/association-section-index-redirect";

export default async function MembresAssociationIndexPage() {
  await redirectAssociationSectionIndex("membres");
}
