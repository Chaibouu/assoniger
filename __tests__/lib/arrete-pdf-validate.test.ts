import { findArreteReference, isArreteReferenceFoundInPdfText } from "@/lib/arrete-pdf-match";

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

describe("findArreteReference — robustesse", () => {
  const scan = `RÉPUBLIQUE DU NIGER
    Fraternité – Travail – Progrès
    MINISTÈRE DE L'INTÉRIEUR
    Arrêté N°000813/MI/SP/D/DGAPJ du 12 mars 2021
    portant reconnaissance de l'association « Jeunesse Active de Tillabéri »
    Tél. : 20 72 21 34 — BP 622 Niamey`;

  it("refuse une année présente dans une date (2021)", () => {
    expect(findArreteReference("2021", scan).status).toBe("not_found");
  });

  it("refuse un numéro présent hors contexte d'acte (boîte postale 622)", () => {
    expect(findArreteReference("622", scan).status).toBe("not_found");
  });

  it("accepte le numéro seul, avec ou sans zéros de tête", () => {
    expect(findArreteReference("000813", scan).status).toBe("found");
    expect(findArreteReference("813", scan).status).toBe("found");
  });

  it("accepte la saisie avec les mots d'introduction", () => {
    expect(findArreteReference("Arrêté n° 000813", scan).status).toBe("found");
  });

  it("accepte la référence complète, quelle que soit la ponctuation", () => {
    expect(findArreteReference("000813 / MI / SP / D / DGAPJ", scan).status).toBe("found");
  });

  it("renvoie un extrait du document pour la référence trouvée", () => {
    const result = findArreteReference("000813", scan);
    expect(result.status).toBe("found");
    if (result.status === "found") expect(result.excerpt).toContain("000813");
  });

  it("tolère les confusions OCR à l'intérieur du numéro (O pour 0, l pour 1)", () => {
    const ocr = "ARRETE N° OOO8l3/MI/SP/D/DGAPJ du 12 mars 2021";
    expect(findArreteReference("000813", ocr).status).toBe("found");
  });

  it("ne transforme pas les mots en chiffres (« ill » n'est pas 111)", () => {
    const text = "Arrêté portant reconnaissance — village de Tillabéri, ville de Niamey";
    expect(findArreteReference("111", text).status).toBe("not_found");
  });

  it("ne valide jamais un numéro seulement proche : il est proposé en suggestion", () => {
    const result = findArreteReference("000812", scan);
    expect(result.status).toBe("near");
    if (result.status === "near") expect(result.suggestion).toContain("000813");
  });

  it("refuse un long numéro hors mention d'acte (téléphone, registre…)", () => {
    expect(findArreteReference("96123456", "Contact : 96123456 — siège à Niamey").status).toBe("not_found");
  });

  // Extrait réel (OCR d'un arrêté du ministère de l'Agriculture)
  const realArrete = `REPUBLIQUE DU NIGER Arrété N° 156 IMAG/EL/OMEN.~ Fraternité — Travail —- Progrés
    MINISTERE DE L'AGRICULTURE portant création d'un Secrétariat Permanent (OMEN).
    LE MINISTERE D'ETAT, Vu la Constitution du 25 Novembre 2010 ;
    Vu le décret n° 2016-161/PRN du 2 avril 2016 ;
    Vu l'arrêté n° 0045/MAG/EL du 4 mai 2018 ;`;

  it("accepte le numéro de l'arrêté lu par OCR (« Arrété N° 156 »)", () => {
    expect(findArreteReference("156", realArrete).status).toBe("found");
    expect(findArreteReference("N° 156/MAG/EL/OMEN", realArrete).status).toBe("found");
  });

  it("refuse le numéro d'un décret cité dans les visas", () => {
    expect(findArreteReference("2016", realArrete).status).toBe("not_found");
    expect(findArreteReference("2016-161", realArrete).status).toBe("not_found");
  });

  it("refuse le numéro d'un autre arrêté cité (« Vu l'arrêté n° … »)", () => {
    expect(findArreteReference("0045", realArrete).status).toBe("not_found");
  });

  it("refuse une saisie trop courte ou sans chiffres", () => {
    expect(findArreteReference("12", scan).status).toBe("not_found");
    expect(findArreteReference("MI/SP", scan).status).toBe("not_found");
  });
});
