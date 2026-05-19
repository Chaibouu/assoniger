import { isArreteReferenceFoundInPdfText } from "@/lib/arrete-pdf-match";

describe("isArreteReferenceFoundInPdfText", () => {
  const corpus =
    "REPUBLIQUE DU NIGER ARRETE N 000139 /MU/L/SG/DGAC du 25 JUIN 2021 MINISTERE DE L URBANISME";

  it("refuse 149 quand le document porte 000139 (faux positif Levenshtein / sous-chaîne)", () => {
    expect(isArreteReferenceFoundInPdfText("149", corpus)).toBe(false);
  });

  it("accepte le numéro complet 000139", () => {
    expect(isArreteReferenceFoundInPdfText("000139", corpus)).toBe(true);
  });

  it("accepte le suffixe 139 si le préfixe du run est uniquement des zéros", () => {
    expect(isArreteReferenceFoundInPdfText("139", corpus)).toBe(true);
  });

  it("accepte la ligne de référence complète", () => {
    expect(isArreteReferenceFoundInPdfText("000139 /MU/L/SG/DGAC", corpus)).toBe(true);
  });
});
