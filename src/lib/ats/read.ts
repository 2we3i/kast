import { A, O, pipe, S } from "@mobily/ts-belt";
import {
  type InlineRun,
  type RichBlock,
  tiptapToRichBlocks,
} from "@/lib/resume/rich-content";
import type { Entry, Field, Resume, Section } from "@/lib/resume/types";

/** Helpers that read a résumé the way the checks need it. */

export function plain(field: Field | undefined): string {
  return field?.kind === "plain" ? S.trim(field.value) : "";
}

export function rich(field: Field | undefined): ReadonlyArray<RichBlock> {
  return field?.kind === "richtext" ? tiptapToRichBlocks(field.value) : [];
}

function runsText(runs: ReadonlyArray<InlineRun>): string {
  return pipe(
    runs,
    A.map((run) => run.text),
    A.join(""),
    S.trim,
  );
}

/** Every line of a rich field: paragraphs and list items alike. */
export function richLines(
  blocks: ReadonlyArray<RichBlock>,
): ReadonlyArray<string> {
  return pipe(
    blocks,
    A.flatMap((block): ReadonlyArray<string> => {
      if (block.type === "paragraph") return [runsText(block.runs)];
      return A.map(block.items, runsText);
    }),
    A.reject(S.isEmpty),
  );
}

/** List items only: the bullets a recruiter scans. */
export function bulletLines(
  blocks: ReadonlyArray<RichBlock>,
): ReadonlyArray<string> {
  return pipe(
    blocks,
    A.filter((block) => block.type === "list"),
    A.flatMap((block) => (block.type === "list" ? block.items : [])),
    A.map(runsText),
    A.reject(S.isEmpty),
  );
}

export function visibleSections(resume: Resume): ReadonlyArray<Section> {
  return A.reject(resume.sections, (section) => section.hidden === true);
}

export function sectionOf(resume: Resume, type: Section["type"]) {
  return A.find(visibleSections(resume), (section) => section.type === type);
}

export function entriesOf(
  resume: Resume,
  type: Section["type"],
): ReadonlyArray<Entry> {
  return O.mapWithDefault(sectionOf(resume, type), [], (s) => s.entries);
}

/** Section types whose entries carry a start/end date range. */
export const DATED_TYPES: ReadonlyArray<Section["type"]> = [
  "experience",
  "internship",
  "projects",
  "organizations",
  "volunteering",
  "education",
  "courses",
];

/** Section types whose entries are jobs, for gap and overlap checks. */
export const JOB_TYPES: ReadonlyArray<Section["type"]> = [
  "experience",
  "internship",
];

/** Section types whose entries hold a description worth bullet checks. */
export const DESCRIBED_TYPES: ReadonlyArray<Section["type"]> = [
  "experience",
  "internship",
  "projects",
  "volunteering",
];

export interface LocatedEntry {
  section: Section;
  entry: Entry;
}

export function entriesOfTypes(
  resume: Resume,
  types: ReadonlyArray<Section["type"]>,
): ReadonlyArray<LocatedEntry> {
  return pipe(
    visibleSections(resume),
    A.filter((section) => A.includes(types, section.type)),
    A.flatMap((section) =>
      A.map(section.entries, (entry) => ({ section, entry })),
    ),
  );
}

/** The entry's human name for an issue message: its title, else its org. */
export function entryLabel(entry: Entry): string {
  const candidates = [
    plain(entry.fields.title),
    plain(entry.fields.role),
    plain(entry.fields.degree),
    plain(entry.fields.name),
    plain(entry.fields.company),
    plain(entry.fields.organization),
    plain(entry.fields.institution),
  ];
  return O.getWithDefault(A.find(candidates, S.isNotEmpty), "—");
}

const MONTHS = [
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

export type DatePrecision = "month" | "year";

export interface ParsedDate {
  /** Months since year 0; a year-only date counts as its January. */
  ordinal: number;
  precision: DatePrecision;
}

/**
 * A stored date ("Jan 2020", "2020", "Present") as a month ordinal. "Present"
 * is `now`. Anything else is unparseable and returns null.
 */
export function parseStoredDate(value: string, now: Date): ParsedDate | null {
  const trimmed = S.trim(value);
  if (!trimmed) return null;
  if (trimmed === "Present") {
    return {
      ordinal: now.getFullYear() * 12 + now.getMonth(),
      precision: "month",
    };
  }
  const year = /\b(\d{4})\b/.exec(trimmed)?.[1];
  if (!year) return null;
  const month = A.getIndexBy(MONTHS, (name) => S.includes(trimmed, name));
  return O.match(
    month,
    (index): ParsedDate => ({
      ordinal: Number(year) * 12 + index,
      precision: "month",
    }),
    (): ParsedDate => ({ ordinal: Number(year) * 12, precision: "year" }),
  );
}
