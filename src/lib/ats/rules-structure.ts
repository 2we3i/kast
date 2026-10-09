import { A, O, pipe, S } from "@mobily/ts-belt";
import { getSectionSchema } from "@/lib/resume/schema-registry";
import type { SectionType } from "@/lib/resume/types";
import {
  entriesOf,
  plain,
  rich,
  richLines,
  sectionOf,
  visibleSections,
} from "./read";
import type { RuleCheck } from "./types";

function hasContent(
  context: Parameters<RuleCheck>[0],
  type: SectionType,
): boolean {
  if (type === "summary") {
    return O.mapWithDefault(
      A.head(entriesOf(context.resume, "summary")),
      false,
      (entry) => A.isNotEmpty(richLines(rich(entry.fields.body))),
    );
  }
  return A.some(entriesOf(context.resume, type), (entry) =>
    A.some(Object.values(entry.fields), (field) =>
      field.kind === "plain"
        ? S.isNotEmpty(S.trim(field.value))
        : A.isNotEmpty(richLines(rich(field))),
    ),
  );
}

export const namePresent: RuleCheck = (context) => {
  const fields = context.resume.header.fields;
  const ok = S.isNotEmpty(plain(fields.firstName) + plain(fields.lastName));
  return { score: ok ? 1 : 0, issues: ok ? [] : [{}] };
};

export const headlinePresent: RuleCheck = (context) => {
  const ok = S.isNotEmpty(plain(context.resume.header.fields.jobTitle));
  return { score: ok ? 1 : 0, issues: ok ? [] : [{}] };
};

export const requiredSections: RuleCheck = (context) => {
  const required = (context.params.sections ??
    []) as ReadonlyArray<SectionType>;
  const missing = A.reject(required, (type) => hasContent(context, type));
  return {
    score: 1 - A.length(missing) / Math.max(1, A.length(required)),
    issues: A.map(missing, (type) => ({
      params: { section: type },
      target: { sectionType: type },
    })),
  };
};

export const summaryPresent: RuleCheck = (context) => {
  const ok = hasContent(context, "summary");
  return {
    score: ok ? 1 : 0,
    issues: ok ? [] : [{ target: { sectionType: "summary" } }],
  };
};

/**
 * Custom sections are the one place a heading is free text. A heading no
 * parser knows (in the document's language or English) may be skipped.
 */
export const standardHeadings: RuleCheck = (context) => {
  const known = A.concat(
    context.config.standardHeadings[context.resume.language] ?? [],
    context.config.standardHeadings.en ?? [],
  );
  const custom = A.filter(
    visibleSections(context.resume),
    (section) => section.type === "custom",
  );
  if (A.isEmpty(custom)) return null;
  const unusual = A.reject(custom, (section) =>
    A.includes(known, S.toLowerCase(S.trim(section.title))),
  );
  return {
    score: 1 - A.length(unusual) / A.length(custom),
    issues: A.map(unusual, (section) => ({
      params: { heading: section.title },
      target: { sectionId: section.id },
    })),
  };
};

/** Experienced candidates lead with experience; education follows it. */
export const sectionOrder: RuleCheck = (context) => {
  const before = context.params.before as SectionType;
  const after = context.params.after as SectionType;
  if (!hasContent(context, before) || !hasContent(context, after)) return null;
  const order = A.map(visibleSections(context.resume), (s) => s.type);
  const first = A.getIndexBy(order, (type) => type === before);
  const second = A.getIndexBy(order, (type) => type === after);
  const ok = pipe(
    O.zip(first, second),
    O.mapWithDefault(true, ([a, b]) => a < b),
  );
  const title = O.mapWithDefault(sectionOf(context.resume, before), "", (s) =>
    s.title === getSectionSchema(before).defaultTitle ? "" : s.title,
  );
  return {
    score: ok ? 1 : 0,
    issues: ok ? [] : [{ params: { before, after, title } }],
  };
};
