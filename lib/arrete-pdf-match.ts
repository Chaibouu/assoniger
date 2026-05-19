/** Supprime les accents (NFD + marques combinantes). */
function stripCombiningMarks(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Espaces / sauts de ligne unifiés, casse neutre. */
function normalizeHuman(s: string): string {
  return stripCombiningMarks(s)
    .toLowerCase()
    .replace(/[\u00a0\u2007\u202f]/g, " ")
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Chaîne alphanumérique compacte (ignore ponctuation et espaces). */
function compactAlnum(s: string): string {
  return stripCombiningMarks(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/** Chiffres consécutifs ; corrige quelques confusions OCR courantes avant extraction des chiffres. */
function digitOnly(s: string): string {
  return s
    .replace(/[OoØø]/g, "0")
    .replace(/[Il|!]/g, "1")
    .replace(/\D/g, "");
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const m = a.length;
  const n = b.length;
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const cur = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[n];
}

/** Segments de 3 à 14 chiffres dans le texte (évite les faux positifs d’une grande chaîne « tous chiffres » collée). */
function extractDigitRuns(text: string): string[] {
  const t = stripCombiningMarks(text.normalize("NFD"))
    .replace(/[OoØø]/g, "0")
    .replace(/[Il|!]/g, "1");
  const out: string[] = [];
  const re = /\d{3,14}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    out.push(m[0]);
  }
  return out;
}

function onlyZeros(s: string): boolean {
  return s.length > 0 && /^0+$/.test(s);
}

/** La saisie correspond à la fin du numéro officiel (zéros de tête omis). Ex. 139 ↔ 000139 */
function runEndsWithRefDigits(run: string, dRef: string): boolean {
  if (!run.endsWith(dRef)) return false;
  const prefix = run.slice(0, run.length - dRef.length);
  return prefix.length === 0 || onlyZeros(prefix);
}

/**
 * Tolérance OCR sur la distance d’édition : très stricte pour les courtes chaînes
 * (évite 149 ≈ 139 avec 1 erreur).
 */
function maxLevenshteinForDigitLength(L: number): number {
  if (L <= 4) return 0;
  if (L <= 6) return 1;
  return Math.min(2, Math.max(1, Math.floor(L * 0.12)));
}

function fuzzySameLengthDigits(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const L = a.length;
  return levenshtein(a, b) <= maxLevenshteinForDigitLength(L);
}

/**
 * Compare un bloc de chiffres saisi aux numéros détectés dans le document (runs), sans fenêtre glissante
 * sur la concaténation de tous les chiffres du PDF.
 */
function digitCandidateMatchesPdfDigits(cand: string, pdfText: string): boolean {
  const dRef = digitOnly(cand);
  if (dRef.length < 3) return false;

  const runs = extractDigitRuns(pdfText);
  for (const run of runs) {
    const r = digitOnly(run);
    if (r === dRef) return true;
    if (runEndsWithRefDigits(r, dRef)) return true;
    if (fuzzySameLengthDigits(r, dRef)) return true;
    if (dRef.length >= 6 && Math.abs(r.length - dRef.length) === 1 && levenshtein(r, dRef) <= 1) {
      return true;
    }
  }
  return false;
}

/**
 * Toutes les variantes numériques plausibles à partir de la saisie (ligne complète ou numéro seul).
 */
function digitCandidatesFromReference(reference: string): string[] {
  const ref = reference.trim();
  const out = new Set<string>();
  const main = digitOnly(ref);
  if (main.length >= 3) {
    out.add(main);
    const sig = main.replace(/^0+/, "") || "0";
    if (sig.length >= 3) out.add(sig);
  }
  const runs = ref.match(/\d{3,14}/g) ?? [];
  for (const r of runs) {
    out.add(r);
    const s = r.replace(/^0+/, "") || "0";
    if (s.length >= 3) out.add(s);
  }
  return [...out].sort((a, b) => b.length - a.length);
}

/**
 * Indique si la référence saisie apparaît de façon plausible dans le texte extrait du PDF.
 */
export function isArreteReferenceFoundInPdfText(reference: string, pdfText: string): boolean {
  const ref = reference.trim();
  if (ref.length < 2) return false;

  const humanRef = normalizeHuman(ref);
  const humanPdf = normalizeHuman(pdfText);
  if (humanRef.length >= 3 && humanPdf.includes(humanRef)) return true;

  const cRef = compactAlnum(ref);
  const cPdf = compactAlnum(pdfText);
  /** Référence uniquement chiffres : ne pas utiliser « includes » sur tout le compact (sous-chaînes ambiguës). */
  if (cRef.length >= 3 && !/^\d+$/.test(cRef) && cPdf.includes(cRef)) return true;

  const dRef = digitOnly(ref);
  if (dRef.length >= 3 && digitCandidateMatchesPdfDigits(dRef, pdfText)) return true;

  for (const cand of digitCandidatesFromReference(ref)) {
    if (digitCandidateMatchesPdfDigits(cand, pdfText)) return true;
  }

  return false;
}
