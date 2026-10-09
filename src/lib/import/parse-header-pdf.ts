import { A, O, pipe, S } from "@mobily/ts-belt";
import type { Field } from "@/lib/resume/types";
import { AGE_WORDS } from "./dictionary";
import type { ConfidenceMap } from "./import-draft";
import { rowText, type TextRow } from "./import-rows";

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/u;
const PHONE = /(?:\+|00)?\d[\d\s()./-]{6,}\d/;
const URL_PATTERN =
  /\b(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s,|]*)?/iu;
const AGE = new RegExp(
  `(?<![\\d])(\\d{2})\\s*(?:${A.join(
    A.map(AGE_WORDS, (word) => S.replaceByRe(word, /[.]/g, "\\.")),
    "|",
  )})(?![\\p{L}])`,
  "iu",
);
const BIRTH_DATE = /\b(\d{4}[-.]\d{2}[-.]\d{2}|\d{2}[-.]\d{2}[-.]\d{4})\b/;

export interface HeaderResult {
  fields: Record<string, Field>;
  confidence: ConfidenceMap;
  /** Preamble lines the header did not use: a summary without a heading. */
  rest: ReadonlyArray<TextRow>;
}

function plain(value: string): Field {
  return { kind: "plain", value: S.trim(value) };
}

function firstMatch(texts: ReadonlyArray<string>, pattern: RegExp): string {
  return O.mapWithDefault(
    A.find(
      A.map(texts, (text) => pattern.exec(text)?.[0] ?? ""),
      S.isNotEmpty,
    ),
    "",
    (value) => S.trim(value),
  );
}

/** Splits "Jonas Petras Jonaitis" into first names and the surname. */
function splitName(full: string): { first: string; last: string } {
  const words = A.reject(S.split(S.trim(full), " "), S.isEmpty);
  if (A.length(words) <= 1) return { first: full, last: "" };
  return {
    first: A.join(A.take(words, A.length(words) - 1), " "),
    last: O.getWithDefault(A.last(words), ""),
  };
}

function isContact(text: string): boolean {
  return EMAIL.test(text) || PHONE.test(text) || URL_PATTERN.test(text);
}

/**
 * The header: the largest text at the top of page one is the name; contacts
 * come from patterns anywhere in the preamble; a short line under the name
 * is the headline; an age ("18 m.", "32 года") or a birth date is kept.
 */
export function parseHeader(
  preamble: ReadonlyArray<TextRow>,
  everything: ReadonlyArray<TextRow>,
): HeaderResult {
  const pool = A.isEmpty(preamble) ? A.take(everything, 8) : preamble;
  const texts = A.map(pool, (row) => rowText(row));
  const nameRow = O.toUndefined(
    A.head(
      A.sort(
        A.filter(pool, (row) => row.page === 1),
        (a, b) => b.size - a.size || a.top - b.top,
      ),
    ),
  );
  // The name row may also carry the city and age in smaller cells.
  const nameCells = nameRow
    ? A.concat(nameRow.label ? [nameRow.label] : [], nameRow.cells)
    : [];
  const name = O.getWithDefault(
    A.find(
      nameCells,
      (cell) => !isContact(cell) && !AGE.test(cell) && /\p{L}/u.test(cell),
    ),
    "",
  );
  const sideCells = A.reject(nameCells, (cell) => cell === name);
  const emails = A.concat(texts, A.map(everything, rowText));
  const email = firstMatch(texts, EMAIL) || firstMatch(emails, EMAIL);
  const phone = firstMatch(texts, PHONE);
  const urls = pipe(
    texts,
    A.map((text) => S.replaceByRe(text, new RegExp(EMAIL, "gu"), " ")),
    A.flatMap((text) =>
      Array.from(text.matchAll(new RegExp(URL_PATTERN, "giu")), (m) => m[0]),
    ),
    A.reject((url) => EMAIL.test(url) || S.includes(url, "@")),
  );
  const linkedin = O.getWithDefault(
    A.find(urls, (url) => /linkedin\./i.test(url)),
    "",
  );
  const others = A.reject(urls, (url) => url === linkedin);
  const website = O.getWithDefault(A.head(others), "");
  const link = O.getWithDefault(A.get(others, 1), "");
  const ageText = firstMatch(A.concat(sideCells, texts), AGE);
  const age = AGE.exec(ageText)?.[1] ?? "";
  const birthDate = age || firstMatch(texts, BIRTH_DATE);
  const city = O.getWithDefault(
    A.find(
      sideCells,
      (cell) => !AGE.test(cell) && !isContact(cell) && /\p{L}/u.test(cell),
    ),
    "",
  );
  const nameIndex = nameRow
    ? A.getIndexBy(pool, (row) => row === nameRow)
    : O.None;
  const headline = O.mapWithDefault(nameIndex, "", (index) => {
    const next = pool[index + 1];
    if (!next) return "";
    const text = rowText(next);
    return !isContact(text) && S.length(text) < 70 && !/[.!?]$/.test(text)
      ? text
      : "";
  });
  const used = new Set(
    A.filterMap(pool, (row) => {
      const text = rowText(row);
      return row === nameRow ||
        (headline && text === headline) ||
        isContact(text) ||
        AGE.test(text)
        ? row
        : undefined;
    }),
  );
  const { first, last } = splitName(name);
  const fields: Record<string, Field> = {
    firstName: plain(first),
    lastName: plain(last),
    jobTitle: plain(headline),
    email: plain(email),
    phone: plain(phone),
    website: plain(S.replaceByRe(website, /^https?:\/\//i, "")),
    linkedin: plain(S.replaceByRe(linkedin, /^https?:\/\//i, "")),
    link: plain(S.replaceByRe(link, /^https?:\/\//i, "")),
    city: plain(city),
    birthDate: plain(birthDate),
  };
  const bigName =
    nameRow !== undefined &&
    A.every(pool, (row) => row === nameRow || row.size < nameRow.size);
  const confidence: ConfidenceMap = {
    ...(name
      ? {
          "header/firstName": bigName ? 0.9 : 0.6,
          "header/lastName": bigName ? 0.9 : 0.6,
        }
      : { "header/firstName": 0.2 }),
    ...(headline ? { "header/jobTitle": 0.55 } : {}),
    ...(email ? { "header/email": 0.98 } : { "header/email": 0.3 }),
    ...(phone ? { "header/phone": 0.9 } : {}),
    ...(website ? { "header/website": 0.8 } : {}),
    ...(linkedin ? { "header/linkedin": 0.95 } : {}),
    ...(city ? { "header/city": 0.6 } : {}),
    ...(birthDate ? { "header/birthDate": 0.8 } : {}),
  };
  return {
    fields,
    confidence,
    rest: A.reject(pool, (row) => used.has(row)),
  };
}
