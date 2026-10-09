import { A, pipe, S } from "@mobily/ts-belt";
import { MONTH_WORDS, monthNumber, PRESENT_WORDS } from "./dictionary";

/**
 * Date parsing for imported résumés. Recognizes the forms job portals and
 * people write: "2025.12", "12/2025", "2025-12", "Dec 2025", "gruodis 2025",
 * "2025 m. gruodis", "декабрь 2025", a bare "2025", and "present" in three
 * languages. Output uses the editor's stored form: "Dec 2025", "2025", or
 * "Present".
 */

const STORED_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function escapeRegExp(word: string): string {
  return S.replaceByRe(word, /[.*+?^${}()|[\]\\]/g, "\\$&");
}

const MONTH = `(?:${A.join(
  A.map(MONTH_WORDS, ([word]) => escapeRegExp(word)),
  "|",
)})\\.?`;

const PRESENT = `(?:${A.join(
  A.map(
    A.sort(PRESENT_WORDS, (a, b) => S.length(b) - S.length(a)),
    escapeRegExp,
  ),
  "|",
)})`;

/** One date: numeric year-month either way round, month words, or a year. */
const DATE = [
  "(?<ym>(?:19|20)\\d{2})[.\\-/](?<ymm>0?[1-9]|1[0-2])(?![\\d])",
  "(?<mm>0?[1-9]|1[0-2])[.\\-/](?<my>(?:19|20)\\d{2})",
  `(?<wm>${MONTH})\\s+(?<wy>(?:19|20)\\d{2})`,
  `(?<ry>(?:19|20)\\d{2})\\s*(?:m\\.|г\\.?)?\\s+(?<rm>${MONTH})`,
  "(?<y>(?:19|20)\\d{2})",
].join("|");

const SEPARATOR = "\\s*(?:-{1,2}|–|—|to|iki|до|по|until)\\s*";

function rename(pattern: string, suffix: string): string {
  return S.replaceByRe(pattern, /\?<(\w+)>/g, `?<$1${suffix}>`);
}

const RANGE = new RegExp(
  `(?<![\\p{L}\\d])(?:${rename(DATE, "1")})${SEPARATOR}(?:(?<present>${PRESENT})|${rename(DATE, "2")})(?![\\p{L}\\d])`,
  "iu",
);

const SINGLE = new RegExp(`(?<![\\p{L}\\d])(?:${DATE})(?![\\p{L}\\d])`, "iu");

type Groups = Record<string, string | undefined>;

function stored(groups: Groups, suffix: string): string {
  const g = (name: string) => groups[`${name}${suffix}`];
  const numeric = (year: string | undefined, month: string | undefined) =>
    `${STORED_MONTHS[Number(month) - 1]} ${year}`;
  if (g("ym")) return numeric(g("ym"), g("ymm"));
  if (g("my")) return numeric(g("my"), g("mm"));
  const word = g("wm") ?? g("rm");
  const year = g("wy") ?? g("ry");
  if (word && year) {
    const month = monthNumber(word);
    return month ? `${STORED_MONTHS[month - 1]} ${year}` : year;
  }
  return g("y") ?? "";
}

export interface ParsedRange {
  start: string;
  end: string;
  /** The text the range was read from, to cut out of its line. */
  matched: string;
}

/** The first date range in `text`, or null. */
export function parseDateRange(text: string): ParsedRange | null {
  const match = RANGE.exec(text);
  if (!match?.groups) return null;
  const groups = match.groups as Groups;
  return {
    start: stored(groups, "1"),
    end: groups.present ? "Present" : stored(groups, "2"),
    matched: match[0],
  };
}

/** A single date (a certificate's year, a publication's month), or null. */
export function parseSingleDate(
  text: string,
): { date: string; matched: string } | null {
  const match = SINGLE.exec(text);
  if (!match?.groups) return null;
  return { date: stored(match.groups as Groups, ""), matched: match[0] };
}

/** `text` with the matched date cut out and stray separators trimmed. */
export function withoutDate(text: string, matched: string): string {
  return pipe(
    S.replace(text, matched, " "),
    // "Acme | 2019 – 2021 | Vilnius" leaves "Acme |  | Vilnius": one bar.
    S.replaceByRe(/\s*([|·•,])(?:\s*[|·•,])+\s*/g, " $1 "),
    S.replaceByRe(/^[\s,|·•–—-]+|[\s,|·•–—-]+$/g, ""),
    S.replaceByRe(/\s{2,}/g, " "),
    S.trim,
  );
}
