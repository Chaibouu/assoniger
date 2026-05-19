import { redirectAssociationSectionIndex } from "@/lib/association-section-index-redirect";

export default async function CandidatAssociationIndexPage() {
  await redirectAssociationSectionIndex("candidats");
}
