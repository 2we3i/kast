import { A, D, O, pipe, S } from "@mobily/ts-belt";
import type { JSONContent } from "@tiptap/core";
import { createEmptyEntry } from "@/lib/resume/factory";
import type { Entry, Field, SectionType } from "@/lib/resume/types";
import {
  type ParsedRange,
  parseDateRange,
  parseSingleDate,
  withoutDate,
} from "./dates";
import { isDurationBadge, isInstitution } from "./dictionary";
import { type ImportMetadata, type Parsed, parsed } from "./import-draft";
import {
  isBullet,
  isHeaderLike,
  rowsToRich,
  type TextRow,
} from "./import-rows";

/** Where each part of an entry goes, per section type. */
interface EntryShape {
  title: string;
  org: string;
  location?: string;
  website?: string;
  description?: string;
  /** Sections with one date rather than a range (certificates, publications). */
  singleDate?: string;
}

export const ENTRY_SHAPES: Partial<Record<SectionType, EntryShape>> = {
  experience: {
    title: "title",
    org: "company",
    location: "location",
    website: "website",
    description: "description",
  },
  internship: {
    title: "title",
    org: "company",
    location: "location",
    website: "website",
    description: "description",
  },
  volunteering: {
    title: "role",
    org: "organization",
    location: "location",
    description: "description",
  },
  projects: {
    title: "title",
    org: "company",
    website: "website",
    description: "description",
  },
  organizations: {
    title: "role",
    org: "organization",
    description: "description",
  },
  education: {
    title: "degree",
    org: "institution",
    location: "location",
    description: "details",
  },
  courses: {
    title: "title",
    org: "provider",
    website: "url",
    description: "description",
  },
  certifications: {
    title: "name",
    org: "issuer",
    website: "url",
    singleDate: "date",
  },
  publications: {
    title: "title",
    org: "publisher",
    website: "url",
    description: "description",
    singleDate: "date",
  },
};

const CONTRACT_WORDS =
  /sutart|contract|договор|full[- ]time|part[- ]time|etat|freelance|laisvai samdom|по совместительству|полная занятость|частичная занятость|internship/i;

const DOMAIN =
  /\b(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+(?:lt|lv|ee|com|org|net|io|eu|ru|ua|by|pl|de|uk|co|dev|app|tech|info)(?:\/[^\s,|]*)?\b/i;

const CITIES =
  /\b(vilnius|kaunas|klaipėda|klaipeda|šiauliai|siauliai|panevėžys|panevezys|alytus|marijampolė|riga|rīga|tallinn|warsaw|warszawa|london|berlin|dublin|oslo|stockholm|helsinki|москва|санкт-петербург|минск|киев|kyiv|remote|nuotoliniu būdu|удаленно|удалённо)\b/iu;

function plain(value: string): Field {
  return { kind: "plain", value: S.trim(value) };
}

function rich(value: JSONContent): Field {
  return { kind: "richtext", value };
}

interface Part {
  text: string;
  bold: boolean;
}

/** "Senior Engineer at Acme" and "Acme | Vilnius" into their parts. */
function splitParts(text: string, bold: boolean): ReadonlyArray<Part> {
  return pipe(
    S.splitByRe(text, /\s+[|•·—–]\s+|\s+-\s+|\s+(?:at|@|в)\s+/u),
    A.map((part) => S.trim(part ?? "")),
    A.reject(S.isEmpty),
    A.map((part) => ({ text: part, bold })),
  );
}

interface HeaderParts {
  range: ParsedRange | null;
  single: string;
  parts: ReadonlyArray<Part>;
  website: string;
  contract: string;
}

function readHeader(rows: ReadonlyArray<TextRow>): HeaderParts {
  const range = O.toUndefined(
    A.find(
      A.flatMap(rows, (row) => [
        parseDateRange(row.label),
        parseDateRange(row.text),
      ]),
      (value) => value !== null,
    ),
  );
  const single = range
    ? ""
    : O.mapWithDefault(
        A.find(
          A.map(rows, (row) => parseSingleDate(`${row.label} ${row.text}`)),
          (value) => value !== null,
        ),
        "",
        (value) => value?.date ?? "",
      );
  const texts = A.map(rows, (row) => ({
    text: range ? withoutDate(row.text, range.matched) : row.text,
    bold: row.bold,
  }));
  const allParts = A.flatMap(texts, (item) => splitParts(item.text, item.bold));
  const website = O.mapWithDefault(
    A.find(
      A.map(allParts, (part) => DOMAIN.exec(part.text)?.[0] ?? ""),
      S.isNotEmpty,
    ),
    "",
    (value) => value,
  );
  const withoutSite = pipe(
    allParts,
    A.map((part) => ({
      ...part,
      text: S.trim(website ? S.replace(part.text, website, "") : part.text),
    })),
    A.reject((part) => S.isEmpty(part.text)),
  );
  // "Warehouse keeper (fixed-term contract)": the contract is metadata.
  const contract = O.mapWithDefault(
    A.find(
      A.map(
        withoutSite,
        (part) =>
          /\(([^()]*(?:\([^()]*\))?[^()]*)\)\s*$/.exec(part.text)?.[1] ?? "",
      ),
      (inner) => CONTRACT_WORDS.test(inner),
    ),
    "",
    (value) => value,
  );
  const parts = contract
    ? A.map(withoutSite, (part) => ({
        ...part,
        text: S.trim(S.replace(part.text, `(${contract})`, "")),
      }))
    : withoutSite;
  return { range: range ?? null, single, parts, website, contract };
}

interface Assigned {
  title: string;
  org: string;
  location: string;
  titleConfidence: number;
  orgConfidence: number;
}

function assign(type: SectionType, parts: ReadonlyArray<Part>): Assigned {
  const location = O.mapWithDefault(
    A.find(parts, (part) => CITIES.test(part.text) && S.length(part.text) < 40),
    "",
    (part) => part.text,
  );
  const rest = A.reject(parts, (part) => part.text === location);
  if (type === "education") {
    const school = A.find(rest, (part) => isInstitution(part.text));
    const degree = A.find(
      rest,
      (part) => O.isNone(school) || part.text !== O.toUndefined(school)?.text,
    );
    return {
      title: O.mapWithDefault(degree, "", (part) => part.text),
      org: O.mapWithDefault(
        school,
        O.mapWithDefault(A.get(rest, 1), "", (p) => p.text),
        (part) => part.text,
      ),
      location,
      titleConfidence: O.isSome(school) ? 0.8 : 0.55,
      orgConfidence: O.isSome(school) ? 0.85 : 0.5,
    };
  }
  const bold = A.filter(rest, (part) => part.bold);
  const regular = A.reject(rest, (part) => part.bold);
  if (A.length(bold) === 1 && A.isNotEmpty(regular)) {
    return {
      title: bold[0]?.text ?? "",
      org: regular[0]?.text ?? "",
      location,
      titleConfidence: 0.85,
      orgConfidence: 0.8,
    };
  }
  return {
    title: O.mapWithDefault(A.get(rest, 0), "", (part) => part.text),
    org: O.mapWithDefault(A.get(rest, 1), "", (part) => part.text),
    location,
    titleConfidence: 0.6,
    orgConfidence: A.length(rest) >= 2 ? 0.55 : 0.3,
  };
}

/** Tenure badges in the label column are metadata, not content. */
function dropBadges(rows: ReadonlyArray<TextRow>) {
  return A.reduce(
    rows,
    {
      rows: [] as ReadonlyArray<TextRow>,
      metadata: [] as ReadonlyArray<ImportMetadata>,
    },
    (acc, row) => {
      if (row.label && isDurationBadge(row.label)) {
        const metadata = A.append(acc.metadata, {
          kind: "duration" as const,
          text: row.label,
        });
        return S.isEmpty(row.text)
          ? { ...acc, metadata }
          : { rows: A.append(acc.rows, { ...row, label: "" }), metadata };
      }
      if (isDurationBadge(row.text)) {
        return {
          ...acc,
          metadata: A.append(acc.metadata, {
            kind: "duration" as const,
            text: row.text,
          }),
        };
      }
      return { ...acc, rows: A.append(acc.rows, row) };
    },
  );
}

function hasDate(row: TextRow): boolean {
  return (
    parseDateRange(row.label) !== null || parseDateRange(row.text) !== null
  );
}

/**
 * Splits a section's rows into entries. A row carrying a date range anchors
 * an entry; header-like rows next to it (bold, larger, or short and without a
 * full stop) belong to its header; the rest is its description. Without any
 * dates, each bold header-like row starts an entry.
 */
function splitEntries(
  rows: ReadonlyArray<TextRow>,
  body: number,
  labelled: boolean,
): ReadonlyArray<{
  header: ReadonlyArray<TextRow>;
  rest: ReadonlyArray<TextRow>;
}> {
  const anchors = A.filterMap(
    A.mapWithIndex(rows, (index, row) => ({ index, row })),
    (item) => (hasDate(item.row) ? item.index : undefined),
  );
  const starts = A.isNotEmpty(anchors)
    ? A.map(anchors, (anchor) => {
        if (labelled) return anchor;
        // Up to two bold or larger rows right above the dated row are its title.
        const above = A.filter([anchor - 2, anchor - 1], (index) => {
          const row = rows[index];
          return (
            row !== undefined &&
            !hasDate(row) &&
            (row.bold || row.size > body * 1.08) &&
            isHeaderLike(row, body)
          );
        });
        return O.getWithDefault(A.head(above), anchor);
      })
    : A.filterMap(
        A.mapWithIndex(rows, (index, row) => ({ index, row })),
        (item) =>
          item.row.bold && isHeaderLike(item.row, body)
            ? item.index
            : undefined,
      );
  if (A.isEmpty(starts))
    return A.isEmpty(rows) ? [] : [{ header: [], rest: rows }];
  const bounds = A.mapWithIndex(starts, (index, start) => ({
    start,
    end: starts[index + 1] ?? A.length(rows),
  }));
  return A.map(bounds, ({ start, end }) => {
    const block = A.slice(rows, start, end - start);
    // A title and company stacked above the dates all belong to the header.
    const dateOffset = O.getWithDefault(
      A.getIndexBy(A.take(block, 4), hasDate),
      0,
    );
    const headerLength = A.reduce(
      A.mapWithIndex(block, (index, row) => ({ index, row })),
      { length: 0, open: true },
      (acc, { index, row }) => {
        if (!acc.open) return acc;
        const header =
          index <= dateOffset ||
          (index <= 3 &&
            (hasDate(row) ||
              ((row.bold || row.size > body * 1.08) &&
                isHeaderLike(row, body))));
        return header
          ? { length: index + 1, open: true }
          : { ...acc, open: false };
      },
    ).length;
    return {
      header: A.take(block, headerLength),
      rest: A.drop(block, headerLength),
    };
  });
}

function setField(entry: Entry, key: string | undefined, value: Field): Entry {
  if (!key) return entry;
  return { ...entry, fields: D.set(entry.fields, key, value) };
}

/**
 * Parses an experience-like, education, course, certificate, or publication
 * section into entries, recording how sure it is of each field.
 */
export function parseEntries(
  type: SectionType,
  rows: ReadonlyArray<TextRow>,
  body: number,
  labelled: boolean,
): Parsed<ReadonlyArray<Entry>> {
  const shape = ENTRY_SHAPES[type];
  if (!shape) return parsed([]);
  const cleaned = dropBadges(rows);
  const blocks = splitEntries(cleaned.rows, body, labelled);
  const results = A.map(blocks, (block) => {
    const header = readHeader(block.header);
    const who = assign(type, header.parts);
    const base = createEmptyEntry(type);
    const description = A.filter(block.rest, (row) => S.isNotEmpty(row.text));
    const filled = pipe(
      base,
      (entry) => setField(entry, shape.title, plain(who.title)),
      (entry) => setField(entry, shape.org, plain(who.org)),
      (entry) => setField(entry, shape.location, plain(who.location)),
      (entry) => setField(entry, shape.website, plain(header.website)),
      (entry) =>
        shape.singleDate
          ? setField(
              entry,
              shape.singleDate,
              plain(header.range?.end || header.range?.start || header.single),
            )
          : setField(
              setField(entry, "startDate", plain(header.range?.start ?? "")),
              "endDate",
              plain(header.range?.end ?? ""),
            ),
      (entry) =>
        shape.description && A.isNotEmpty(description)
          ? setField(entry, shape.description, rich(rowsToRich(description)))
          : entry,
    );
    const id = filled.id;
    const scores: ReadonlyArray<
      readonly [string | undefined, number, boolean]
    > = [
      [shape.title, who.title ? who.titleConfidence : 0.2, true],
      [shape.org, who.org ? who.orgConfidence : 0.3, true],
      [shape.location, 0.5, Boolean(who.location)],
      [shape.website, 0.9, Boolean(header.website)],
      ["startDate", header.range ? 0.95 : 0.3, !shape.singleDate],
      ["endDate", header.range ? 0.95 : 0.3, !shape.singleDate],
      [
        shape.singleDate,
        header.range || header.single ? 0.9 : 0.4,
        Boolean(shape.singleDate),
      ],
      [
        shape.description,
        A.some(description, (row) => isBullet(row.text)) ? 0.85 : 0.7,
        A.isNotEmpty(description),
      ],
    ];
    const entryConfidence = pipe(
      scores,
      A.filter(([key, , applies]) => Boolean(key) && applies),
      A.map(([key, score]) => [`${id}/${key}`, score] as const),
      D.fromPairs,
    );
    return {
      entry: filled,
      confidence: entryConfidence,
      metadata: header.contract
        ? [{ kind: "contract" as const, text: header.contract }]
        : [],
      // A certificate has no description field: keep its extra lines visible.
      leftovers:
        !shape.description && A.isNotEmpty(description)
          ? A.map(description, (row) => row.text)
          : [],
    };
  });
  return {
    value: A.map(results, (result) => result.entry),
    confidence: A.reduce(
      results,
      {} as Record<string, number>,
      (acc, result) => ({
        ...acc,
        ...result.confidence,
      }),
    ),
    metadata: A.concat(
      cleaned.metadata,
      A.flatMap(results, (result) => result.metadata),
    ),
    leftovers: A.flatMap(results, (result) => result.leftovers),
  };
}
