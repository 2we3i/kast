import { A, O, pipe, S } from "@mobily/ts-belt";
import { markdownToTiptap, tiptapToMarkdown } from "@/lib/interchange/markdown";
import {
  getCustomFields,
  getSectionSchema,
} from "@/lib/resume/schema-registry";
import type {
  Entry,
  Field,
  Resume,
  Section,
  SectionType,
} from "@/lib/resume/types";
import { updateSectionById, updateSections } from "@/lib/resume/update";

/**
 * The résumé as the AI sees it: a flat list of text fields, each with a
 * stable path, so an answer can name exactly which field it changes and
 * nothing outside that list can be touched. Contact details are not part of
 * it at all; only content is.
 */
export interface AiField {
  /** "header/jobTitle" or "<sectionId>/<entryId>/<fieldKey>". */
  path: string;
  section: SectionType | "header";
  key: string;
  kind: "plain" | "rich";
  /** Plain text, or the restricted markdown dialect for rich fields. */
  text: string;
  /** Read-only context for the model: which job, school, or project. */
  context: string;
}

/** What a task may change: the content, or every text field (translation). */
export type AiScope = "content" | "all";

/** Plain fields that carry meaning worth rewording (or translating). */
const CONTENT_PLAIN_KEYS: Record<string, ReadonlyArray<string>> = {
  skills: ["description"],
};

/** Plain fields translated but never reworded: names of things. */
const TRANSLATABLE_PLAIN_KEYS: Record<string, ReadonlyArray<string>> = {
  experience: ["title", "companyContext"],
  internship: ["title", "companyContext"],
  projects: ["company"],
  organizations: ["role"],
  volunteering: ["role"],
  education: ["degree"],
  courses: ["title"],
  certifications: ["name"],
  publications: ["title"],
  skills: ["name", "description", "level"],
  languages: ["name", "level"],
  references: ["position"],
  driving: ["note"],
  availability: ["notice", "workType"],
  custom: ["title", "subtitle"],
};

function plain(field: Field | undefined): string {
  return field?.kind === "plain" ? S.trim(field.value) : "";
}

function entryContext(section: Section, entry: Entry): string {
  const parts = [
    plain(entry.fields.title),
    plain(entry.fields.role),
    plain(entry.fields.degree),
    plain(entry.fields.name),
    plain(entry.fields.company),
    plain(entry.fields.organization),
    plain(entry.fields.institution),
    plain(entry.fields.provider),
    A.join(
      A.reject(
        [plain(entry.fields.startDate), plain(entry.fields.endDate)],
        S.isEmpty,
      ),
      " – ",
    ),
  ];
  return `${section.type}: ${A.join(A.reject(parts, S.isEmpty), ", ")}`;
}

function fieldKeys(section: Section, scope: AiScope) {
  const schemaFields =
    section.type === "custom"
      ? getCustomFields(section.variant ?? "rich")
      : getSectionSchema(section.type).fields;
  const plainKeys =
    scope === "all"
      ? (TRANSLATABLE_PLAIN_KEYS[section.type] ?? [])
      : (CONTENT_PLAIN_KEYS[section.type] ?? []);
  return A.filter(
    schemaFields,
    (field) => field.kind === "richtext" || A.includes(plainKeys, field.key),
  );
}

function sectionFields(
  section: Section,
  scope: AiScope,
): ReadonlyArray<AiField> {
  const keys = fieldKeys(section, scope);
  return A.flatMap(section.entries, (entry) =>
    A.filterMap(keys, (schema) => {
      const field = entry.fields[schema.key];
      const text =
        field?.kind === "richtext"
          ? S.trim(tiptapToMarkdown(field.value))
          : plain(field);
      if (S.isEmpty(text)) return O.None;
      return O.Some({
        path: `${section.id}/${entry.id}/${schema.key}`,
        section: section.type,
        key: schema.key,
        kind:
          schema.kind === "richtext" ? ("rich" as const) : ("plain" as const),
        text,
        context: entryContext(section, entry),
      });
    }),
  );
}

/** Every field a task may read and change, in reading order. */
export function buildAiFields(
  resume: Resume,
  scope: AiScope,
): ReadonlyArray<AiField> {
  const headline = plain(resume.header.fields.jobTitle);
  const header: ReadonlyArray<AiField> = S.isEmpty(headline)
    ? []
    : [
        {
          path: "header/jobTitle",
          section: "header",
          key: "jobTitle",
          kind: "plain",
          text: headline,
          context: "headline",
        },
      ];
  return A.concat(
    header,
    pipe(
      resume.sections,
      A.reject((section) => section.hidden === true),
      A.flatMap((section) => sectionFields(section, scope)),
    ),
  );
}

export interface AiChange {
  path: string;
  after: string;
}

function setField(field: Field | undefined, text: string): Field {
  if (field?.kind === "richtext") {
    return { kind: "richtext", value: markdownToTiptap(text) };
  }
  return { kind: "plain", value: S.trim(text) };
}

/**
 * Writes accepted changes into the résumé. A path that does not name a field
 * of this document is ignored, so an answer can never create structure.
 */
export function applyAiChanges(
  resume: Resume,
  changes: ReadonlyArray<AiChange>,
): Resume {
  return A.reduce(changes, resume, (current, change) => {
    const [first, second, third] = S.split(change.path, "/");
    if (first === "header" && second === "jobTitle") {
      return {
        ...current,
        header: {
          ...current.header,
          fields: {
            ...current.header.fields,
            jobTitle: { kind: "plain", value: S.trim(change.after) },
          },
        },
      };
    }
    if (!first || !second || !third) return current;
    return updateSections(
      current,
      updateSectionById(first, (section) => ({
        ...section,
        entries: A.map(section.entries, (entry) => {
          if (entry.id !== second || !(third in entry.fields)) return entry;
          return {
            ...entry,
            fields: {
              ...entry.fields,
              [third]: setField(entry.fields[third], change.after),
            },
          };
        }),
      })),
    );
  });
}
