import { A, D, O, pipe, S } from "@mobily/ts-belt";
import type { SectionType } from "@/lib/resume/types";
import dictionary from "./import-dictionary.json";

/**
 * Typed access to import-dictionary.json: the words, phrases, and patterns
 * the PDF import recognizes in Lithuanian, English, and Russian. Extending
 * recognition is a data change there, not a code change here.
 */

/** A heading's meaning: a section type, or the "other information" bucket. */
export type HeadingKind = SectionType | "other";

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native";

export type LanguageSkill = "speaking" | "understanding" | "writing";

/** Lowercase, single-spaced, without the punctuation that trails labels. */
export function normalize(text: string): string {
  return pipe(
    text,
    S.toLowerCase,
    S.replaceByRe(/[\s ]+/g, " "),
    S.replaceByRe(/^[\s:•·\-–—|*]+|[\s:.;,•·\-–—|*]+$/g, ""),
    S.trim,
  );
}

const HEADINGS = new Map<string, HeadingKind>(
  A.flatMap(
    D.toPairs(
      dictionary.headings as unknown as Record<
        HeadingKind,
        ReadonlyArray<string>
      >,
    ),
    ([kind, words]) =>
      A.map(words, (word) => [normalize(word), kind as HeadingKind] as const),
  ),
);

/** The section a heading line names, or null for ordinary text. */
export function headingKind(text: string): HeadingKind | null {
  const key = normalize(text);
  if (S.length(key) > 60) return null;
  const exact = HEADINGS.get(key);
  if (exact) return exact;
  // "Vairuotojo pažymėjimas / kategorija (neprivaloma)": drop the aside.
  const stripped = normalize(S.replaceByRe(key, /\(.*?\)|\/.*$/g, ""));
  return HEADINGS.get(stripped) ?? null;
}

function compile(patterns: ReadonlyArray<string>): ReadonlyArray<RegExp> {
  return A.map(patterns, (pattern) => new RegExp(pattern, "iu"));
}

const DURATION = compile(dictionary.badges.duration);
const PAGE_NUMBER = compile(dictionary.portals.pageNumber);
const LEVEL_PREFIX = A.map(dictionary.badges.levelPrefix, normalize);
const FIELD_LABELS = new Set(A.map(dictionary.badges.fieldLabels, normalize));

/** "6 mėnesiai", "1 metai 2 mėnesiai", "2 года 3 месяца": a tenure badge. */
export function isDurationBadge(text: string): boolean {
  const key = normalize(text);
  return A.some(DURATION, (pattern) => pattern.test(key));
}

/** "Lygis Įgudęs" → "Įgudęs"; null when the text is no level badge. */
export function levelBadge(text: string): string | null {
  const key = normalize(text);
  const prefix = A.find(LEVEL_PREFIX, (word) => S.startsWith(key, `${word} `));
  return O.mapWithDefault(prefix, null as string | null, (word) =>
    S.trim(S.sliceToEnd(S.trim(text), S.length(word))),
  );
}

export function isFieldLabel(text: string): boolean {
  return FIELD_LABELS.has(normalize(text));
}

export function isPageNumber(text: string): boolean {
  const key = normalize(text);
  return A.some(PAGE_NUMBER, (pattern) => pattern.test(key));
}

/** A portal's name, footer phrase, or a bare portal domain. */
export function isPortalFurniture(text: string): boolean {
  const key = normalize(text);
  if (A.some(dictionary.portals.phrases, (phrase) => S.includes(key, phrase))) {
    return true;
  }
  return A.some(
    dictionary.portals.domains,
    (domain) =>
      key === domain ||
      key === `www.${domain}` ||
      S.endsWith(key, ` ${domain}`),
  );
}

const LEVEL_WORDS = new Map<string, CefrLevel>(
  A.flatMap(
    D.toPairs(
      dictionary.languageLevels as unknown as Record<
        CefrLevel,
        ReadonlyArray<string>
      >,
    ),
    ([level, words]) =>
      A.map(words, (word) => [normalize(word), level as CefrLevel] as const),
  ),
);

/** A language level written as a CEFR code or a word, as a CEFR level. */
export function languageLevel(text: string): CefrLevel | null {
  const key = normalize(text);
  const code = /\b([abc][12])\b/i.exec(key)?.[1];
  if (code) return S.toUpperCase(code) as CefrLevel;
  return LEVEL_WORDS.get(key) ?? null;
}

const SKILL_WORDS = new Map<string, LanguageSkill>(
  A.flatMap(
    D.toPairs(
      dictionary.languageSkills as Record<LanguageSkill, ReadonlyArray<string>>,
    ),
    ([skill, words]) =>
      A.map(
        words,
        (word) => [normalize(word), skill as LanguageSkill] as const,
      ),
  ),
);

export function languageSkill(text: string): LanguageSkill | null {
  return SKILL_WORDS.get(normalize(text)) ?? null;
}

export function isInstitution(text: string): boolean {
  const key = normalize(text);
  return A.some(dictionary.institutionWords, (word) => S.includes(key, word));
}

export function isPresentWord(text: string): boolean {
  const key = normalize(text);
  return A.some(dictionary.presentWords, (word) => key === normalize(word));
}

export const PRESENT_WORDS: ReadonlyArray<string> = dictionary.presentWords;

/** Every month word, longest first, for building the date pattern. */
export const MONTH_WORDS: ReadonlyArray<readonly [string, number]> = pipe(
  D.toPairs(dictionary.months as Record<string, ReadonlyArray<string>>),
  A.flatMap(([month, words]) =>
    A.map(words, (word) => [word, Number(month)] as const),
  ),
  A.sort((a, b) => S.length(b[0]) - S.length(a[0])),
);

export function monthNumber(word: string): number | null {
  const key = S.replaceByRe(normalize(word), /\.$/, "");
  return O.mapWithDefault(
    A.find(MONTH_WORDS, ([name]) => name === key),
    null as number | null,
    ([, month]) => month,
  );
}

export const SALARY_WORDS = dictionary.salary;
export const AVAILABILITY_WORDS = dictionary.availability as Record<
  string,
  ReadonlyArray<string>
>;
export const AGE_WORDS: ReadonlyArray<string> = dictionary.ageWords;
