import { A, D, O, pipe, R, S } from "@mobily/ts-belt";
import {
  createCustomSection,
  createEmptyResume,
  createEmptySection,
} from "@/lib/resume/factory";
import { canonicalSectionIndex } from "@/lib/resume/schema-registry";
import type {
  Entry,
  Resume,
  ResumeLanguage,
  Section,
  SectionType,
} from "@/lib/resume/types";
import type { HeadingKind } from "./dictionary";
import type { ImportDraft, ImportMetadata, Parsed } from "./import-draft";
import {
  bodySize,
  rowsToPlain,
  rowText,
  type TextRow,
  toTextRow,
} from "./import-rows";
import { type RawSection, splitSections } from "./import-sections";
import { buildLayout } from "./layout-columns";
import { removeFurniture } from "./layout-furniture";
import { buildLines } from "./layout-lines";
import { parseEntries } from "./parse-entries";
import {
  parseAvailability,
  parseBody,
  parseDriving,
  parseSalary,
} from "./parse-facts";
import { parseHeader } from "./parse-header-pdf";
import { parseLanguages, parseReferences, parseSkills } from "./parse-lists";
import { extractPdfItems, type ImportFailure } from "./pdf-items";

export interface ImportOptions {
  title: string;
  language: ResumeLanguage;
  templateId: string;
}

const ENTRY_TYPES: ReadonlyArray<SectionType> = [
  "experience",
  "internship",
  "volunteering",
  "projects",
  "organizations",
  "education",
  "courses",
  "certifications",
  "publications",
];

interface SectionResult {
  type: SectionType;
  title: string;
  parsed: Parsed<ReadonlyArray<Entry>>;
}

function parseSection(
  section: RawSection,
  body: number,
  labelled: boolean,
): O.Option<SectionResult> {
  const kind = section.kind as HeadingKind | "custom";
  const result = (type: SectionType, value: Parsed<ReadonlyArray<Entry>>) =>
    O.Some({ type, title: section.title, parsed: value });
  if (A.includes(ENTRY_TYPES, kind as SectionType)) {
    return result(
      kind as SectionType,
      parseEntries(kind as SectionType, section.rows, body, labelled),
    );
  }
  switch (kind) {
    case "skills":
      return result("skills", parseSkills(section.rows, labelled));
    case "languages":
      return result("languages", parseLanguages(section.rows, labelled));
    case "references":
      return result("references", parseReferences(section.rows, labelled));
    case "salary":
      return result("salary", parseSalary(section.rows));
    case "availability":
      return result("availability", parseAvailability(section.rows));
    case "driving":
      return result("driving", parseDriving(section.rows));
    case "summary":
    case "interests":
      return result(kind, parseBody(kind, section.rows));
    case "custom":
    case "other":
      return result("custom", parseBody("custom", section.rows));
    default:
      return O.None;
  }
}

/** Entries of one section type, merged when the type appears twice. */
function mergeByType(results: ReadonlyArray<SectionResult>) {
  return pipe(
    A.reject(results, (result) => result.type === "custom"),
    A.groupBy((result) => result.type),
    D.map((group) => A.flatMap(group ?? [], (result) => result.parsed.value)),
  ) as Partial<Record<SectionType, ReadonlyArray<Entry>>>;
}

function buildSections(
  base: Resume,
  results: ReadonlyArray<SectionResult>,
): ReadonlyArray<Section> {
  const byType = mergeByType(results);
  const core = A.map(base.sections, (section) => ({
    ...section,
    entries: byType[section.type] ?? section.entries,
  }));
  const present = new Set(A.map(core, (section) => section.type));
  const optional = pipe(
    D.toPairs(byType as Record<string, ReadonlyArray<Entry> | undefined>),
    A.filter(
      ([type, entries]) =>
        !present.has(type as SectionType) && A.isNotEmpty(entries ?? []),
    ),
    A.map(([type, entries]) => ({
      ...createEmptySection(type as SectionType),
      entries: entries ?? [],
    })),
  );
  const custom = pipe(
    results,
    A.filter(
      (result) => result.type === "custom" && A.isNotEmpty(result.parsed.value),
    ),
    A.map((result) => ({
      ...createCustomSection("rich", result.title || "Other"),
      entries: result.parsed.value,
    })),
  );
  return pipe(
    A.concat(core, optional),
    A.sort(
      (a, b) => canonicalSectionIndex(a.type) - canonicalSectionIndex(b.type),
    ),
    A.concat(custom),
  );
}

/** Rows with label and content flattened to plain lines, for text-only uses. */
export function rowsToLines(
  rows: ReadonlyArray<TextRow>,
): ReadonlyArray<string> {
  return A.map(rows, rowText);
}

/**
 * Turns a PDF into a draft résumé for review, entirely in the browser:
 * positioned text → lines → page furniture removed → columns and reading
 * order → sections by heading (Lithuanian, English, Russian) → entries with a
 * confidence for every field. Nothing is saved until the user confirms.
 */
export async function importPdf(
  bytes: Uint8Array,
  options: ImportOptions,
): Promise<R.Result<ImportDraft, ImportFailure>> {
  const extracted = await extractPdfItems(bytes);
  if (R.isError(extracted)) return R.makeError(R.getExn(R.flip(extracted)));
  const doc = R.getExn(extracted);
  const furniture = removeFurniture(doc, buildLines(doc));
  const layout = buildLayout(doc, furniture.lines);
  const labelled = layout.kind === "labels";
  const streams = A.map(layout.streams, (stream) => A.map(stream, toTextRow));
  const everything = A.flat(streams);
  const body = bodySize(everything);
  const sections = A.flatMap(streams, (rows) => splitSections(rows, body));
  const preamble = A.flatMap(
    A.filter(sections, (section) => section.kind === "preamble"),
    (section) => section.rows,
  );
  const header = parseHeader(preamble, everything);
  const results = A.filterMap(
    A.reject(sections, (section) => section.kind === "preamble"),
    (section) => O.toUndefined(parseSection(section, body, labelled)),
  );
  // A long paragraph above the first heading is a summary without a title.
  const restText = rowsToPlain(header.rest);
  const hasSummary = A.some(results, (result) => result.type === "summary");
  const preambleSummary =
    !hasSummary && A.length(S.split(restText, " ")) >= 20
      ? [
          {
            type: "summary" as const,
            title: "",
            parsed: parseBody("summary", header.rest),
          },
        ]
      : [];
  const allResults = A.concat(results, preambleSummary);
  const base = {
    ...createEmptyResume(options.title),
    language: options.language,
    templateId: options.templateId,
  };
  const resume: Resume = {
    ...base,
    header: { fields: { ...base.header.fields, ...header.fields } },
    sections: buildSections(base, allResults),
  };
  const metadata: ReadonlyArray<ImportMetadata> = A.flatMap(
    allResults,
    (result) => result.parsed.metadata,
  );
  return R.makeOk({
    resume,
    confidence: A.reduce(allResults, header.confidence, (acc, result) => ({
      ...acc,
      ...result.parsed.confidence,
    })),
    metadata,
    removed: furniture.removed,
    leftovers: [
      ...(A.isEmpty(preambleSummary) && S.isNotEmpty(restText)
        ? [restText]
        : []),
      ...A.flatMap(allResults, (result) => result.parsed.leftovers),
    ],
    layout: layout.kind,
    text: A.join(A.map(everything, rowText), "\n"),
  });
}

/**
 * The PDF's text in reading order, one line per row: what an ATS would read.
 * The landing page's parser proof shows this.
 */
export async function pdfToText(
  bytes: Uint8Array,
): Promise<R.Result<string, ImportFailure>> {
  const extracted = await extractPdfItems(bytes);
  return R.map(extracted, (doc) => {
    const furniture = removeFurniture(doc, buildLines(doc));
    const layout = buildLayout(doc, furniture.lines);
    return A.join(
      A.map(A.flat(layout.streams), (row) => rowText(toTextRow(row))),
      "\n",
    );
  });
}
