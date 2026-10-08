import { A, G, O, pipe, S } from "@mobily/ts-belt";
import { RESUME_LABELS } from "@/lib/resume/labels";
import { type RichBlock, tiptapToRichBlocks } from "@/lib/resume/rich-content";
import type { Entry, Field, Resume, Section } from "@/lib/resume/types";
import { joinPresent } from "@/lib/utils";
import type { ExperienceItemView } from "./resume-preview";
import { plain, withHttps } from "./resume-to-preview-header";

type Labels = (typeof RESUME_LABELS)[keyof typeof RESUME_LABELS];

export function richBlocks(field: Field | undefined): ReadonlyArray<RichBlock> {
  if (field?.kind !== "richtext") return [];
  return tiptapToRichBlocks(field.value);
}

/** The visible section of a type, or None when absent or hidden. */
export function visibleSection(
  resume: Resume,
  type: Section["type"],
): O.Option<Section> {
  return pipe(
    A.find(resume.sections, (section) => section.type === type),
    O.filter((section) => !section.hidden),
  );
}

function entriesOf(
  resume: Resume,
  type: Section["type"],
): ReadonlyArray<Entry> {
  return O.mapWithDefault(
    A.find(resume.sections, (section) => section.type === type),
    [],
    (section) => section.entries,
  );
}

function firstEntry(resume: Resume, type: Section["type"]): O.Option<Entry> {
  return pipe(
    visibleSection(resume, type),
    O.flatMap((s) => A.head(s.entries)),
  );
}

function paragraph(text: string): RichBlock {
  return { type: "paragraph", runs: [{ text }] };
}

/** Lines become one paragraph each; an all-empty set yields no blocks. */
function paragraphs(lines: ReadonlyArray<string>): ReadonlyArray<RichBlock> {
  return pipe(lines, A.reject(S.isEmpty), A.map(paragraph));
}

export function volunteeringItems(
  resume: Resume,
): ReadonlyArray<ExperienceItemView> {
  return A.map(entriesOf(resume, "volunteering"), (entry) => ({
    id: entry.id,
    role: plain(entry.fields.role),
    company: plain(entry.fields.organization),
    location: plain(entry.fields.location),
    startDate: plain(entry.fields.startDate),
    endDate: plain(entry.fields.endDate),
    description: richBlocks(entry.fields.description),
  }));
}

export function courseItems(resume: Resume): ReadonlyArray<ExperienceItemView> {
  return A.map(entriesOf(resume, "courses"), (entry) => {
    const url = plain(entry.fields.url);
    return {
      id: entry.id,
      role: plain(entry.fields.title),
      roleHref: url ? withHttps(url) : undefined,
      company: plain(entry.fields.provider),
      startDate: plain(entry.fields.startDate),
      endDate: plain(entry.fields.endDate),
      description: richBlocks(entry.fields.description),
    };
  });
}

export function publicationItems(
  resume: Resume,
): ReadonlyArray<ExperienceItemView> {
  return A.map(entriesOf(resume, "publications"), (entry) => {
    const url = plain(entry.fields.url);
    return {
      id: entry.id,
      role: plain(entry.fields.title),
      roleHref: url ? withHttps(url) : undefined,
      company: plain(entry.fields.publisher),
      startDate: "",
      endDate: plain(entry.fields.date),
      description: richBlocks(entry.fields.description),
    };
  });
}

// References carry no dates; the contact line rides on `companyContext`, which
// every template prints under the company line.
export function referenceItems(
  resume: Resume,
): ReadonlyArray<ExperienceItemView> {
  return A.map(entriesOf(resume, "references"), (entry) => ({
    id: entry.id,
    role: plain(entry.fields.name),
    company: joinPresent(
      [plain(entry.fields.position), plain(entry.fields.company)],
      ", ",
    ),
    companyContext: joinPresent(
      [plain(entry.fields.email), plain(entry.fields.phone)],
      " · ",
    ),
    startDate: "",
    endDate: "",
    description: [],
  }));
}

export function interestBlocks(resume: Resume): ReadonlyArray<RichBlock> {
  return O.mapWithDefault(firstEntry(resume, "interests"), [], (entry) =>
    richBlocks(entry.fields.body),
  );
}

export function drivingBlocks(resume: Resume): ReadonlyArray<RichBlock> {
  const labels = RESUME_LABELS[resume.language];
  return O.mapWithDefault(firstEntry(resume, "driving"), [], (entry) => {
    const categories = plain(entry.fields.categories);
    const note = plain(entry.fields.note);
    const line = joinPresent(
      [categories ? `${labels.drivingCategory} ${categories}` : "", note],
      ". ",
    );
    return paragraphs([line]);
  });
}

function salaryLine(entry: Entry, labels: Labels): string {
  const amount = plain(entry.fields.amount);
  if (!amount) return "";
  const period = labels.per[plain(entry.fields.period)] ?? "";
  const tax = labels.tax[plain(entry.fields.tax)] ?? "";
  const sum = joinPresent([amount, plain(entry.fields.currency)], " ");
  const head = joinPresent([sum, period], " ");
  return tax ? `${head} (${tax})` : head;
}

export function salaryBlocks(resume: Resume): ReadonlyArray<RichBlock> {
  const labels = RESUME_LABELS[resume.language];
  return O.mapWithDefault(firstEntry(resume, "salary"), [], (entry) =>
    paragraphs([salaryLine(entry, labels)]),
  );
}

function availabilityLines(
  entry: Entry,
  labels: Labels,
): ReadonlyArray<string> {
  const status = labels.availabilityStatus[plain(entry.fields.status)] ?? "";
  const from = plain(entry.fields.from);
  const notice = plain(entry.fields.notice);
  const relocation = plain(entry.fields.relocation);
  const relocationLines: Record<string, string> = {
    yes: labels.relocationYes,
    no: labels.relocationNo,
  };
  const relocationLine = relocationLines[relocation] ?? "";
  return [
    status,
    from ? `${labels.availableFrom}: ${from}` : "",
    notice ? `${labels.notice}: ${notice}` : "",
    plain(entry.fields.workType),
    relocationLine,
  ];
}

export function availabilityBlocks(resume: Resume): ReadonlyArray<RichBlock> {
  const labels = RESUME_LABELS[resume.language];
  return O.mapWithDefault(firstEntry(resume, "availability"), [], (entry) => {
    const line = pipe(
      availabilityLines(entry, labels),
      A.filter(G.isString),
      A.reject(S.isEmpty),
      A.join(" · "),
    );
    return paragraphs([line]);
  });
}

/**
 * "Speaking C1 · Understanding C2 · Writing B2" in the document's language,
 * with "native" spelled out; empty when no skill level is set.
 */
export function languageSkillsLine(entry: Entry, labels: Labels): string {
  const level = (value: string) => (value === "native" ? labels.native : value);
  const parts: ReadonlyArray<readonly [string, string]> = [
    [labels.speaking, plain(entry.fields.speaking)],
    [labels.understanding, plain(entry.fields.understanding)],
    [labels.writing, plain(entry.fields.writing)],
  ];
  return pipe(
    parts,
    A.reject(([, value]) => S.isEmpty(value)),
    A.map(([label, value]) => `${label} ${level(value)}`),
    A.join(" · "),
  );
}
