/** Supprime les accents (NFD + marques combinantes). */
function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Normalise espaces, casse, accents. */
function normalizeHuman(s: string): string {
  return stripAccents(s)
    .toLowerCase()
    .replace(/[   ]/g, " ")
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Chaîne alphanumérique compacte (sans ponctuation ni espaces). */
function compactAlnum(s: string): string {
  return stripAccents(s).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Remplace les séparateurs courants dans les numéros d'arrêté (/, -, ., \, _)
 * par un espace normalisé pour comparer "2024-012/MATD" == "2024 012 MATD".
 */
function normalizeSeparators(s: string): string {
  return s
    .replace(/[/\\.\-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Corrections OCR courantes avant extraction des chiffres. */
function ocrFix(s: string): string {
  return s
    .replace(/[OoØø]/g, "0")
    .replace(/[Il|!]/g, "1")
    .replace(/[Ss]/g, "5")
    .replace(/[Zz]/g, "2");
}

/** Uniquement les chiffres (après corrections OCR). */
function digitOnly(s: string): string {
  return ocrFix(s).replace(/\D/g, "");
}

/** Distance de Levenshtein. */
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

/** Tolérance Levenshtein calibrée par longueur. */
function maxLev(len: number): number {
  if (len <= 3) return 0;
  if (len <= 5) return 1;
  if (len <= 9) return 1;
  return Math.min(2, Math.floor(len * 0.13));
}

/** Runs de chiffres (3–14) extraits du texte PDF, après corrections OCR. */
function extractDigitRuns(text: string): string[] {
  const t = ocrFix(stripAccents(text));
  return [...t.matchAll(/\d{3,14}/g)].map((m) => m[0]);
}

/** Vérifie si `run` se termine par `ref` (avec éventuels zéros de tête avant). */
function endsWith(run: string, ref: string): boolean {
  if (!run.endsWith(ref)) return false;
  return /^0*$/.test(run.slice(0, run.length - ref.length));
}

/** Compare deux séquences de chiffres avec tolérance floue. */
function fuzzyDigits(a: string, b: string): boolean {
  if (a === b) return true;
  if (endsWith(a, b) || endsWith(b, a)) return true;
  if (Math.abs(a.length - b.length) <= 1 && levenshtein(a, b) <= maxLev(Math.max(a.length, b.length))) return true;
  return false;
}

/** Toutes les séquences de chiffres candidates issues de la référence saisie. */
function digitCandidates(reference: string): string[] {
  const out = new Set<string>();
  const runs = [...reference.matchAll(/\d{3,14}/g)].map((m) => m[0]);
  for (const r of runs) {
    out.add(r);
    const stripped = r.replace(/^0+/, "") || "0";
    if (stripped.length >= 3) out.add(stripped);
  }
  const full = digitOnly(reference);
  if (full.length >= 3) {
    out.add(full);
    const stripped = full.replace(/^0+/, "") || "0";
    if (stripped.length >= 3) out.add(stripped);
  }
  return [...out].sort((a, b) => b.length - a.length);
}

/** Teste si au moins un candidat chiffre de la référence correspond à un run chiffre du PDF. */
function digitMatchFound(reference: string, pdfText: string): boolean {
  const candidates = digitCandidates(reference);
  if (candidates.length === 0) return false;
  const pdfRuns = extractDigitRuns(pdfText);
  for (const cand of candidates) {
    for (const run of pdfRuns) {
      if (fuzzyDigits(digitOnly(cand), digitOnly(run))) return true;
    }
  }
  return false;
}

/**
 * Génère toutes les variantes de matching à tester pour la référence saisie :
 * - Référence entière normalisée
 * - Séparateurs remplacés par espace
 * - Version compacte alphanumérique
 * - Sous-parties (tokens) de la référence
 * - Numéro seul sans préfixe "N°", "Arrêté", etc.
 */
function buildRefVariants(reference: string): string[] {
  const ref = reference.trim();
  const variants = new Set<string>();

  // Nettoyage du préfixe "N°", "n°", "numéro", "arrêté n°" etc.
  const cleaned = ref
    .replace(/^\s*(arr[eê]t[eé]s?\s*)?(n[°o°º]\.?\s*|num[eé]ro\s*)/i, "")
    .trim();

  const candidates = [ref, cleaned];

  for (const c of candidates) {
    if (!c) continue;
    variants.add(normalizeHuman(c));
    variants.add(normalizeHuman(normalizeSeparators(c)));
    variants.add(compactAlnum(c));

    // Tokens individuels (longueur ≥ 2, on exclut les mots vides courts)
    const tokens = normalizeHuman(normalizeSeparators(c)).split(" ").filter((t) => t.length >= 2);
    for (const t of tokens) {
      variants.add(t);
    }
    // Paires de tokens consécutifs
    for (let i = 0; i < tokens.length - 1; i++) {
      variants.add(`${tokens[i]} ${tokens[i + 1]}`);
    }
  }

  // Retire les variants trop courts ou trop génériques
  const STOP = new Set(["le", "la", "de", "du", "et", "en", "au", "un", "ne"]);
  return [...variants].filter((v) => v.length >= 2 && !STOP.has(v));
}

/**
 * Cherche une variante dans le texte PDF (inclusion directe ou fuzzy sur tokens).
 */
function variantFoundInPdf(variant: string, humanPdf: string, compactPdf: string): boolean {
  if (humanPdf.includes(variant)) return true;
  // Matching compact (ignore séparateurs)
  const cv = compactAlnum(variant);
  if (cv.length >= 3 && !/^\d+$/.test(cv) && compactPdf.includes(cv)) return true;
  // Fuzzy sur les tokens : chaque token de la variante doit être présent (ou proche) dans le PDF
  const tokens = variant.split(" ").filter((t) => t.length >= 3);
  if (tokens.length >= 2 && tokens.every((t) => {
    if (humanPdf.includes(t)) return true;
    const words = humanPdf.split(" ");
    return words.some((w) => w.length >= 3 && levenshtein(w, t) <= maxLev(t.length));
  })) return true;
  return false;
}

/**
 * Indique si la référence saisie apparaît de façon plausible dans le texte extrait du PDF.
 *
 * Stratégies (ordre décroissant de fiabilité) :
 * 1. Inclusion directe (texte normalisé)
 * 2. Inclusion avec séparateurs homogénéisés
 * 3. Inclusion compacte alphanumérique
 * 4. Sous-parties + fuzzy sur tokens
 * 5. Correspondance des séquences de chiffres (OCR-tolerant)
 */
export function isArreteReferenceFoundInPdfText(reference: string, pdfText: string): boolean {
  const ref = reference.trim();
  if (ref.length < 2) return false;

  const humanPdf = normalizeHuman(pdfText);
  const compactPdf = compactAlnum(pdfText);

  for (const variant of buildRefVariants(ref)) {
    if (variantFoundInPdf(variant, humanPdf, compactPdf)) return true;
  }

  // Fallback chiffres uniquement (robuste aux erreurs OCR sur les numéros)
  if (digitMatchFound(ref, pdfText)) return true;

  return false;
}
