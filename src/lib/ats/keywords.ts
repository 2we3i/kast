import { A, D, O, pipe, S } from "@mobily/ts-belt";
import type { AtsConfig, KeywordReport } from "./types";

/**
 * Keyword matching without AI: the vacancy's most telling terms, checked
 * against the résumé. Lithuanian and Russian inflect heavily, so terms are
 * compared by a shared stem rather than letter for letter.
 */

const TOKEN = /[\p{L}\p{N}][\p{L}\p{N}+#.]*[\p{L}\p{N}+#]|[\p{L}\p{N}]/gu;

interface Token {
  text: string;
  /** Written with a capital letter in the source, e.g. "Python", "SQL". */
  capitalized: boolean;
  /** Index of the sentence it sits in; bigrams never cross sentences. */
  sentence: number;
}

function tokenize(text: string): ReadonlyArray<Token> {
  const sentences = A.map(
    S.splitByRe(text, /[.!?;:\n•·|]+\s/u),
    (part) => part ?? "",
  );
  return A.flat(
    A.mapWithIndex(sentences, (sentence, part) =>
      Array.from(part.matchAll(TOKEN), (match) => ({
        text: S.toLowerCase(S.replaceByRe(match[0], /\.$/, "")),
        capitalized: /^\p{Lu}/u.test(match[0]),
        sentence,
      })),
    ),
  );
}

/**
 * Endings that inflection adds in Lithuanian, Russian, and English, longest
 * first, so "programavimas" and "programavimo", or "программирование" and
 * "программирования", reduce to the same stem.
 */
const SUFFIXES: ReadonlyArray<string> = [
  "ированием",
  "ирование",
  "ирования",
  "ированию",
  "ованием",
  "ование",
  "ования",
  "ованию",
  "ениями",
  "ением",
  "ениям",
  "ениях",
  "ение",
  "ения",
  "ений",
  "иями",
  "ости",
  "ость",
  "imais",
  "imams",
  "imas",
  "imai",
  "imus",
  "imų",
  "imo",
  "imą",
  "imu",
  "ojo",
  "uose",
  "iais",
  "ais",
  "ams",
  "ose",
  "ius",
  "ių",
  "iai",
  "ami",
  "ями",
  "ого",
  "его",
  "ому",
  "ему",
  "ыми",
  "ими",
  "ing",
  "ers",
  "ies",
  "ed",
  "es",
  "er",
  "as",
  "is",
  "ys",
  "us",
  "os",
  "ės",
  "ai",
  "ui",
  "ов",
  "ев",
  "ей",
  "ий",
  "ый",
  "ой",
  "ая",
  "ое",
  "ые",
  "ие",
  "ам",
  "ям",
  "ах",
  "ях",
  "ом",
  "ем",
  "ą",
  "ę",
  "į",
  "ų",
  "a",
  "e",
  "i",
  "o",
  "s",
  "а",
  "я",
  "о",
  "е",
  "ы",
  "и",
  "у",
  "ю",
  "ь",
];

const MIN_STEM = 4;

/** A comparison stem: the word with its inflected ending dropped. */
export function stem(word: string): string {
  if (S.length(word) <= MIN_STEM || /[+#.]/.test(word)) return word;
  return O.mapWithDefault(
    A.find(
      SUFFIXES,
      (suffix) =>
        S.endsWith(word, suffix) &&
        S.length(word) - S.length(suffix) >= MIN_STEM,
    ),
    word,
    (suffix) => S.slice(word, 0, S.length(word) - S.length(suffix)),
  );
}

function stopwordSet(config: AtsConfig): Set<string> {
  return new Set(A.flat(D.values(config.stopwords)));
}

function isTerm(token: string, stop: Set<string>): boolean {
  if (stop.has(token)) return false;
  if (/^\d+([.,]\d+)?$/.test(token)) return false;
  const technical = /[+#]/.test(token);
  return S.length(token) >= (technical ? 2 : 3);
}

interface Occurrence {
  term: string;
  weight: number;
  position: number;
}

interface Candidate {
  term: string;
  score: number;
  first: number;
}

function occurrences(
  tokens: ReadonlyArray<Token>,
  stop: Set<string>,
): ReadonlyArray<Occurrence> {
  return A.flat(
    A.mapWithIndex(tokens, (index, token): ReadonlyArray<Occurrence> => {
      if (!isTerm(token.text, stop)) return [];
      const word = {
        term: token.text,
        weight: token.capitalized ? 1.5 : 1,
        position: index,
      };
      const next = O.toUndefined(A.get(tokens, index + 1));
      if (
        !next ||
        next.sentence !== token.sentence ||
        !isTerm(next.text, stop)
      ) {
        return [word];
      }
      return [
        word,
        { term: `${token.text} ${next.text}`, weight: 0.75, position: index },
      ];
    }),
  );
}

function toCandidate(group: ReadonlyArray<Occurrence>): O.Option<Candidate> {
  return O.map(A.head(group), (head) => ({
    term: head.term,
    score: A.reduce(group, 0, (sum, item) => sum + item.weight),
    first: head.position,
  }));
}

/**
 * The vacancy's top terms: frequent words and two-word phrases, with a boost
 * for capitalized terms (tool and technology names), stopwords of all three
 * languages removed.
 */
export function extractKeywords(
  text: string,
  config: AtsConfig,
  top: number,
): ReadonlyArray<string> {
  const stop = stopwordSet(config);
  return pipe(
    occurrences(tokenize(text), stop),
    A.groupBy((item) => item.term),
    D.values,
    A.filterMap((group) => toCandidate(group ?? [])),
    // A phrase must recur to count; one-off word pairs are noise.
    A.filter(
      (candidate) => !S.includes(candidate.term, " ") || candidate.score >= 1.5,
    ),
    A.sort((a, b) => b.score - a.score || a.first - b.first),
    A.map((candidate) => candidate.term),
    A.take(top),
  );
}

function stemsOf(text: string): Set<string> {
  return new Set(A.map(tokenize(text), (token) => stem(token.text)));
}

/**
 * Stems match when equal, or when one extends the other by a letter or two
 * (a derivational ending the suffix list does not know).
 */
function stemMatches(stems: Set<string>, wanted: string): boolean {
  if (stems.has(wanted)) return true;
  if (S.length(wanted) < 5) return false;
  return A.some(Array.from(stems), (candidate) => {
    const [short, long] =
      S.length(candidate) < S.length(wanted)
        ? [candidate, wanted]
        : [wanted, candidate];
    return (
      S.length(short) >= 5 &&
      S.startsWith(long, short) &&
      S.length(long) - S.length(short) <= 2
    );
  });
}

function containsTerm(stems: Set<string>, term: string): boolean {
  return A.every(S.split(term, " "), (word) => stemMatches(stems, stem(word)));
}

export function matchKeywords(
  resumeText: string,
  keywords: ReadonlyArray<string>,
): KeywordReport {
  const stems = stemsOf(resumeText);
  return {
    found: A.filter(keywords, (term) => containsTerm(stems, term)),
    missing: A.reject(keywords, (term) => containsTerm(stems, term)),
  };
}
