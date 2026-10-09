import { A, D, O, pipe, S } from "@mobily/ts-belt";
import { createEmptyEntry } from "@/lib/resume/factory";
import type { Entry, Field, SectionType } from "@/lib/resume/types";
import { parseSingleDate } from "./dates";
import { AVAILABILITY_WORDS, normalize, SALARY_WORDS } from "./dictionary";
import { type Parsed, parsed } from "./import-draft";
import {
  asContent,
  rowsToPlain,
  rowsToRich,
  type TextRow,
} from "./import-rows";

function plain(value: string): Field {
  return { kind: "plain", value: S.trim(value) };
}

function entryWith(type: SectionType, values: Record<string, string>): Entry {
  const entry = createEmptyEntry(type);
  return {
    ...entry,
    fields: A.reduce(D.toPairs(values), entry.fields, (fields, [key, value]) =>
      D.set(fields, key, plain(value)),
    ),
  };
}

function includesAny(text: string, words: ReadonlyArray<string>): boolean {
  const key = normalize(text);
  return A.some(words, (word) => S.includes(key, normalize(word)));
}

const CURRENCIES = SALARY_WORDS.currencies as Record<string, string>;

/** "1200 Eur (atskaičius mokesčius)" → 1200, EUR, per month, net. */
export function parseSalary(
  rows: ReadonlyArray<TextRow>,
): Parsed<ReadonlyArray<Entry>> {
  const text = rowsToPlain(asContent(rows));
  const amount = /(\d[\d\s.,]*\d|\d)(?:\s*[-–]\s*(\d[\d\s.,]*\d|\d))?/.exec(
    text,
  );
  if (!amount) return parsed([], { leftovers: S.isEmpty(text) ? [] : [text] });
  const lower = S.toLowerCase(text);
  const currency = O.mapWithDefault(
    A.find(D.keys(CURRENCIES), (token) => S.includes(lower, token)),
    "",
    (token) => CURRENCIES[token] ?? "",
  );
  const tax = includesAny(text, SALARY_WORDS.net)
    ? "net"
    : includesAny(text, SALARY_WORDS.gross)
      ? "gross"
      : "";
  const period = includesAny(text, SALARY_WORDS.year)
    ? "year"
    : includesAny(text, SALARY_WORDS.hour)
      ? "hour"
      : "month";
  const value = S.replaceByRe(S.trim(amount[0]), /\s+/g, " ");
  const entry = entryWith("salary", { amount: value, currency, period, tax });
  return parsed([entry], {
    confidence: {
      [`${entry.id}/amount`]: 0.9,
      [`${entry.id}/currency`]: currency ? 0.85 : 0.3,
      [`${entry.id}/tax`]: tax ? 0.8 : 0.4,
      [`${entry.id}/period`]: 0.55,
    },
  });
}

/** "Galima darbo pradžia: Nedelsiant" → available immediately. */
export function parseAvailability(
  rows: ReadonlyArray<TextRow>,
): Parsed<ReadonlyArray<Entry>> {
  const text = rowsToPlain(asContent(rows));
  if (S.isEmpty(text)) return parsed([]);
  const status = O.getWithDefault(
    A.find(D.keys(AVAILABILITY_WORDS), (key) =>
      includesAny(text, AVAILABILITY_WORDS[key] ?? []),
    ),
    "",
  );
  const date = parseSingleDate(text);
  const notice =
    /(\d+)\s*(weeks?|months?|savait\p{L}*|mėn\p{L}*|недел\p{L}*|месяц\p{L}*)/iu.exec(
      text,
    )?.[0] ?? "";
  const entry = entryWith("availability", {
    status: status || (date ? "from-date" : ""),
    from: date?.date ?? "",
    notice,
    workType: "",
    relocation: "",
  });
  return parsed([entry], {
    confidence: { [`${entry.id}/status`]: status ? 0.8 : 0.35 },
    leftovers: status || date ? [] : [text],
  });
}

const LICENCE = /\b(AM|A1|A2|A|B1|BE|B|C1E|C1|CE|C|D1E|D1|DE|D|T)\b/g;

/** "B", "B, C1", "Kategorija B (nuo 2015)" → the categories. */
export function parseDriving(
  rows: ReadonlyArray<TextRow>,
): Parsed<ReadonlyArray<Entry>> {
  const text = rowsToPlain(asContent(rows));
  const categories = A.uniq(Array.from(text.matchAll(LICENCE), (m) => m[0]));
  if (A.isEmpty(categories))
    return parsed([], { leftovers: S.isEmpty(text) ? [] : [text] });
  const note = pipe(
    S.replaceByRe(text, LICENCE, ""),
    S.replaceByRe(/^[\s,;:/.-]+|[\s,;:/.-]+$/g, ""),
    S.trim,
  );
  const entry = entryWith("driving", {
    categories: A.join(categories, ", "),
    note: S.length(note) > 2 ? note : "",
  });
  return parsed([entry], { confidence: { [`${entry.id}/categories`]: 0.85 } });
}

/** A rich-text singleton (summary, interests) or a custom section body. */
export function parseBody(
  type: "summary" | "interests" | "custom",
  rows: ReadonlyArray<TextRow>,
): Parsed<ReadonlyArray<Entry>> {
  const content = A.filter(asContent(rows), (row) => S.isNotEmpty(row.text));
  if (A.isEmpty(content)) return parsed([]);
  const entry = createEmptyEntry(type === "custom" ? "custom" : type);
  const filled: Entry = {
    ...entry,
    fields: {
      ...entry.fields,
      body: { kind: "richtext", value: rowsToRich(content) },
    },
  };
  return parsed([filled], { confidence: { [`${filled.id}/body`]: 0.8 } });
}
