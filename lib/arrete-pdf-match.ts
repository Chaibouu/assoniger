/**
 * Recherche du numéro d'arrêté saisi dans le texte d'un PDF (couche texte ou OCR).
 *
 * Règles (on préfère refuser plutôt que valider à tort) :
 * - la référence complète lettres + chiffres (ex. « 000139/MU/L/SG/DGAC ») est acceptée partout ;
 * - un numéro seul doit apparaître comme nombre isolé, juste après la mention de l'acte
 *   (« Arrêté n° », « Décision n° »…) — ni l'année d'une date, ni un téléphone, ni le numéro
 *   d'un décret cité dans les visas (« Vu le décret n° … ») ;
 * - les zéros de tête sont ignorés (139 ↔ 000139) ;
 * - les confusions OCR (O/0, I/l/1) ne sont tolérées qu'à l'intérieur du numéro recherché ;
 * - un numéro seulement *proche* n'est jamais validé : il est renvoyé comme suggestion.
 */

export type ArreteMatchResult =
  | { status: "found"; excerpt: string; strength: "full" | "number" }
  | { status: "near"; excerpt: string; suggestion: string }
  | { status: "not_found" };

type Normalized = { text: string; map: number[] };

/** Minuscules, sans accents, espaces unifiés ; `map[i]` = index du caractère d'origine. */
function normalizeWithMap(input: string): Normalized {
  let text = "";
  const map: number[] = [];
  let lastSpace = true;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (/\s/.test(ch)) {
      if (!lastSpace) {
        text += " ";
        map.push(i);
        lastSpace = true;
      }
      continue;
    }
    const base = ch.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
    for (const b of base) {
      text += b;
      map.push(i);
    }
    lastSpace = false;
  }
  return { text, map };
}

/** Uniquement lettres et chiffres, avec correspondance vers le texte normalisé. */
function compactWithMap(norm: Normalized): Normalized {
  let text = "";
  const map: number[] = [];
  for (let i = 0; i < norm.text.length; i++) {
    const ch = norm.text[i];
    if (/[a-z0-9]/.test(ch)) {
      text += ch;
      map.push(norm.map[i]);
    }
  }
  return { text, map };
}

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

/** Extrait lisible (une ligne) autour d'une zone du texte d'origine. */
function excerptAround(original: string, start: number, end: number): string {
  const from = Math.max(0, start - 45);
  const to = Math.min(original.length, end + 45);
  const raw = original.slice(from, to).replace(/\s+/g, " ").trim();
  return `${from > 0 ? "…" : ""}${raw}${to < original.length ? "…" : ""}`;
}

/** Mentions de l'acte lui-même (« Arrêté », lu aussi « Arrété », « ARRETE »… à l'OCR). */
const ACT_MENTION_RE = /(arr[a-z]{0,2}t[a-z]{0,2}|decision|recepiss[a-z]*|agrement)/g;
/** Autres textes cités dans les visas : leur numéro n'est pas celui de l'arrêté. */
const OTHER_ACT_RE = /\b(decret|loi|ordonnance|circulaire)\b/;

/**
 * Le nombre commençant à `start` est-il le numéro de l'acte ? Il doit suivre de près une mention
 * d'arrêté / décision / récépissé / agrément :
 * - sans autre nombre entre les deux (« Arrêté n° 813 du 12 mars 2021 » : 2021 refusé) ;
 * - sans « décret », « loi »… entre les deux ;
 * - et pas dans une citation « Vu l'arrêté n° … » (visa d'un autre texte).
 */
function hasReferenceContext(norm: string, start: number): boolean {
  const windowStart = Math.max(0, start - 60);
  const before = norm.slice(windowStart, start);
  let mentionStart = -1;
  let mentionEnd = -1;
  for (const m of before.matchAll(ACT_MENTION_RE)) {
    mentionStart = m.index ?? 0;
    mentionEnd = mentionStart + m[0].length;
  }
  if (mentionEnd < 0) return false;

  const between = before.slice(mentionEnd);
  if (/\d/.test(between) || OTHER_ACT_RE.test(between)) return false;

  const absoluteMentionStart = windowStart + mentionStart;
  const lead = norm.slice(Math.max(0, absoluteMentionStart - 25), absoluteMentionStart);
  return !/\bvu\b/.test(lead);
}

/** Retire de la saisie les mots d'introduction (« Arrêté n° … »). */
function cleanReference(reference: string): string {
  return normalizeWithMap(reference.trim())
    .text.replace(/^(arrete\s*)?(n\s*[°º]\s*|n\s+|no\.?\s+|numero\s*:?\s*)?/, "")
    .trim();
}

/** Chiffre → classe tolérant les confusions OCR (0/o, 1/i/l/|). */
function digitPattern(digits: string): string {
  return [...digits].map((c) => (c === "0" ? "[0o]" : c === "1" ? "[1il|]" : c)).join("");
}

function stripLeadingZeros(digits: string): string {
  return digits.replace(/^0+/, "") || "0";
}

/**
 * Regex du numéro : groupes de chiffres de la saisie (ex. 2024-012 → 2 groupes), séparateurs souples,
 * zéros de tête facultatifs, nombre isolé (pas collé à d'autres chiffres ni au milieu d'un mot).
 */
function buildNumberRegex(groups: string[]): RegExp {
  const parts = groups.map((g, i) =>
    i === 0 ? `[0o]*${digitPattern(stripLeadingZeros(g))}` : digitPattern(g)
  );
  // Avant : ni chiffre ni lettre, sauf « n » / « o » (ex. « N°000139 » lu « n000139 » à l'OCR)
  return new RegExp(`(?<![0-9a-mp-z|])${parts.join("[\\s\\-/._]{0,3}")}(?![0-9])`, "g");
}

/** Nombres (tolérant O/I/l à l'intérieur d'un jeton contenant déjà un chiffre) avec leur position. */
function numberTokens(norm: string): { value: string; start: number; end: number }[] {
  const out: { value: string; start: number; end: number }[] = [];
  const re = /[0-9oil|]*[0-9][0-9oil|]*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(norm)) !== null) {
    const value = m[0].replace(/o/g, "0").replace(/[il|]/g, "1");
    if (value.length >= 3) out.push({ value, start: m.index, end: m.index + m[0].length });
  }
  return out;
}

export function findArreteReference(reference: string, pdfText: string): ArreteMatchResult {
  const ref = cleanReference(reference);
  const digitGroups = ref.match(/\d+/g) ?? [];
  const totalDigits = digitGroups.join("").length;
  if (!pdfText.trim() || totalDigits < 3) return { status: "not_found" };

  const norm = normalizeWithMap(pdfText);

  // 1. Référence complète lettres + chiffres (forte) : acceptée partout
  const refCompact = ref.replace(/[^a-z0-9]/g, "");
  if (refCompact.length >= 6 && /[a-z]/.test(refCompact) && /\d/.test(refCompact)) {
    const compact = compactWithMap(norm);
    const idx = compact.text.indexOf(refCompact);
    if (idx >= 0) {
      const start = compact.map[idx];
      const end = compact.map[idx + refCompact.length - 1] + 1;
      return { status: "found", strength: "full", excerpt: excerptAround(pdfText, start, end) };
    }
  }

  // 2. Numéro isolé, juste après la mention de l'acte (« Arrêté n° … »)
  const significant = stripLeadingZeros(digitGroups.join(""));
  const re = buildNumberRegex(digitGroups);
  let m: RegExpExecArray | null;
  while ((m = re.exec(norm.text)) !== null) {
    const realDigits = (m[0].match(/\d/g) ?? []).length;
    if (realDigits < Math.ceil(significant.length / 2)) continue; // surtout des lettres : pas un numéro
    if (hasReferenceContext(norm.text, m.index)) {
      const start = norm.map[m.index];
      const end = norm.map[m.index + m[0].length - 1] + 1;
      return { status: "found", strength: "number", excerpt: excerptAround(pdfText, start, end) };
    }
  }

  // 3. Numéro proche en contexte (probable faute de frappe) : jamais validé, proposé en suggestion
  const refDigits = digitGroups.join("");
  if (digitGroups.length === 1 && refDigits.length >= 4) {
    const maxDistance = refDigits.length >= 8 ? 2 : 1;
    for (const token of numberTokens(norm.text)) {
      const candidate = stripLeadingZeros(token.value);
      if (candidate === significant) continue;
      if (!hasReferenceContext(norm.text, token.start)) continue;
      // Comparaison sur le numéro complet (000812 ↔ 000813) et sans zéros de tête (812 ↔ 813)
      const distance = Math.min(
        levenshtein(token.value, refDigits),
        levenshtein(candidate, significant)
      );
      if (distance <= maxDistance && Math.abs(token.value.length - refDigits.length) <= 1) {
        const start = norm.map[token.start];
        const end = norm.map[token.end - 1] + 1;
        return {
          status: "near",
          suggestion: pdfText.slice(start, end).trim(),
          excerpt: excerptAround(pdfText, start, end),
        };
      }
    }
  }

  return { status: "not_found" };
}

/** Compatibilité : true uniquement si la référence est retrouvée avec certitude. */
export function isArreteReferenceFoundInPdfText(reference: string, pdfText: string): boolean {
  return findArreteReference(reference, pdfText).status === "found";
}

/** Le texte contient-il déjà une mention d'acte numérotée exploitable (évite un OCR inutile) ? */
export function hasNumberedReferenceMention(pdfText: string): boolean {
  const norm = normalizeWithMap(pdfText).text;
  return /(arr[a-z]{0,2}t[a-z]*|decision|recepisse)[^0-9]{0,40}\d{3,}/.test(norm);
}
