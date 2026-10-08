import { A, D, O, pipe, S } from "@mobily/ts-belt";
import { resolveFont } from "@/lib/fonts";
import { RESUME_LABELS } from "@/lib/resume/labels";
import type { RichBlock } from "@/lib/resume/rich-content";
import {
  getSectionSchema,
  isReorderableSection,
  REORDERABLE_SECTION_TYPES,
  type ReorderableSectionType,
} from "@/lib/resume/schema-registry";
import type { Resume, Section } from "@/lib/resume/types";
import { localizeDateValue } from "./month-year-menu/month-year-menu-data";
import type {
  CustomSectionView,
  ExperienceItemView,
  ResumePreview,
  SectionHeadings,
} from "./resume-preview";
import { byRecency } from "./resume-sort";
import {
  availabilityBlocks,
  courseItems,
  drivingBlocks,
  interestBlocks,
  languageSkillsLine,
  publicationItems,
  referenceItems,
  richBlocks,
  salaryBlocks,
  visibleSection,
  volunteeringItems,
} from "./resume-to-preview-extra";
import {
  isAtsMode,
  plain,
  toHeaderView,
  withHttps,
} from "./resume-to-preview-header";

type Labels = (typeof RESUME_LABELS)[keyof typeof RESUME_LABELS];

function sectionOfType(
  resume: Resume,
  type: Section["type"],
): O.Option<Section> {
  return A.find(resume.sections, (section) => section.type === type);
}

function entriesOfType(resume: Resume, type: Section["type"]) {
  return O.mapWithDefault(
    sectionOfType(resume, type),
    [],
    (section) => section.entries,
  );
}

/** Document line height bounded to 1.2..2, or null for the template baseline. */
function clampLineHeight(value: number | undefined): number | null {
  if (value == null) return null;
  return Math.min(2, Math.max(1.2, value));
}

/** Font-size multiplier, defaulting to 1 and bounded to the editor's range. */
function clampScale(value: number | undefined): number {
  return Math.min(1.2, Math.max(0.8, value ?? 1));
}

/** A design-mode accent, or null in ATS mode and for a malformed value. */
function resolveAccent(resume: Resume): string | null {
  if (isAtsMode(resume)) return null;
  const value = resume.accentColor ?? "";
  return /^#[0-9a-f]{6}$/i.test(value) ? value : null;
}

/** The document-language label for each section type's heading. */
function headingLabel(type: keyof SectionHeadings, labels: Labels): string {
  if (type === "certifications") return labels.certificates;
  return labels[type];
}

/**
 * A stored title equal to the registry default means "never renamed": it
 * renders as the document-language label, which is how language switching
 * relabels headings. Anything else is a deliberate rename and wins.
 */
function effectiveHeading(
  resume: Resume,
  type: keyof SectionHeadings,
  labels: Labels,
): string {
  const fallback = headingLabel(type, labels);
  const title = O.mapWithDefault(sectionOfType(resume, type), "", (section) =>
    S.trim(section.title),
  );
  if (!title || title === getSectionSchema(type).defaultTitle) return fallback;
  return title;
}

function buildHeadings(resume: Resume, labels: Labels): SectionHeadings {
  const types = A.concat(
    ["summary"] as ReadonlyArray<keyof SectionHeadings>,
    A.reject(
      REORDERABLE_SECTION_TYPES,
      (type) => type === "custom",
    ) as ReadonlyArray<keyof SectionHeadings>,
  );
  return pipe(
    types,
    A.map((type) => [type, effectiveHeading(resume, type, labels)] as const),
    D.fromPairs,
  ) as SectionHeadings;
}

function customBody(section: Section): ReadonlyArray<RichBlock> {
  if ((section.variant ?? "rich") !== "rich") return [];
  return O.mapWithDefault(A.head(section.entries), [], (entry) =>
    richBlocks(entry.fields.body),
  );
}

// Custom list entries keep document order (no recency sort): they are freeform
// and often carry no dates.
function customEntries(section: Section): ReadonlyArray<ExperienceItemView> {
  if (section.variant !== "list") return [];
  return A.map(section.entries, (entry) => ({
    id: entry.id,
    role: plain(entry.fields.title),
    company: plain(entry.fields.subtitle),
    startDate: plain(entry.fields.startDate),
    endDate: plain(entry.fields.endDate),
    description: richBlocks(entry.fields.description),
  }));
}

/**
 * True when a preview carries no user content: an untouched document that would
 * render as a blank sheet. Callers surface a placeholder instead of the empty page.
 */
export function isResumePreviewEmpty(preview: ResumePreview): boolean {
  const { header } = preview;
  return (
    !header.fullName &&
    !header.headline &&
    A.isEmpty(header.contacts) &&
    A.isEmpty(preview.summary) &&
    A.isEmpty(preview.experience) &&
    A.isEmpty(preview.organizations) &&
    A.isEmpty(preview.education) &&
    A.isEmpty(preview.certificates) &&
    A.isEmpty(preview.skills) &&
    A.isEmpty(preview.languages) &&
    A.isEmpty(preview.customSections)
  );
}

function localizer(labels: Labels) {
  return <T extends { startDate: string; endDate: string }>(item: T): T => ({
    ...item,
    startDate: localizeDateValue({
      value: item.startDate,
      months: labels.months,
      present: labels.present,
    }),
    endDate: localizeDateValue({
      value: item.endDate,
      months: labels.months,
      present: labels.present,
    }),
  });
}

function jobItems(resume: Resume, type: "experience" | "internship") {
  return A.map(entriesOfType(resume, type), (entry) => {
    const website = plain(entry.fields.website);
    return {
      id: entry.id,
      role: plain(entry.fields.title),
      company: plain(entry.fields.company),
      companyHref: website ? withHttps(website) : undefined,
      location: plain(entry.fields.location),
      companyContext: plain(entry.fields.companyContext),
      startDate: plain(entry.fields.startDate),
      endDate: plain(entry.fields.endDate),
      description: richBlocks(entry.fields.description),
    };
  });
}

function showsProficiency(resume: Resume, type: "skills" | "languages") {
  return O.mapWithDefault(
    sectionOfType(resume, type),
    true,
    (section) => section.showProficiency ?? true,
  );
}

function gridColumns(resume: Resume, type: "skills" | "languages") {
  return O.mapWithDefault(
    sectionOfType(resume, type),
    2,
    (section) => section.columns ?? 2,
  );
}

/**
 * Projects the persisted `Resume` onto the `ResumePreview` view-model every
 * template renders. This is the single Resume → presentation seam: preview
 * components and every export read this, never the storage schema.
 */
export function resumeToPreview(resume: Resume): ResumePreview {
  const labels = RESUME_LABELS[resume.language] ?? RESUME_LABELS.en;
  const localizeDates = localizer(labels);
  const dated = (items: ReadonlyArray<ExperienceItemView>) =>
    pipe(items, A.sort(byRecency), A.map(localizeDates));

  const summary = pipe(
    visibleSection(resume, "summary"),
    O.flatMap((section) => A.head(section.entries)),
    O.mapWithDefault([], (entry) => richBlocks(entry.fields.body)),
  );

  // Hidden sections drop out of the emitted order entirely, so no renderer
  // (preview, PDF, docx, plain text) ever sees their heading or entries.
  const sectionOrder = pipe(
    resume.sections,
    A.filter(
      (section) => isReorderableSection(section.type) && !section.hidden,
    ),
    A.map((section) => ({
      type: section.type as ReorderableSectionType,
      id: section.id,
    })),
  );

  const customSections: ReadonlyArray<CustomSectionView> = pipe(
    resume.sections,
    A.filter((section) => section.type === "custom"),
    A.map((section) => ({
      id: section.id,
      title: section.title,
      variant: section.variant ?? "rich",
      body: customBody(section),
      entries: A.map(customEntries(section), localizeDates),
    })),
  );

  // Hiding proficiency is presentation-only: blank it here, the single view
  // chokepoint, so every downstream renderer drops it without a flag.
  const skillsShowProficiency = showsProficiency(resume, "skills");
  const languagesShowProficiency = showsProficiency(resume, "languages");

  return {
    language: resume.language,
    atsMode: isAtsMode(resume),
    accent: resolveAccent(resume),
    // Clamped so a hand-edited document can adjust spacing but never push a
    // heading gap negative (-24 cancels the 24-unit baseline exactly).
    sectionSpacing: Math.min(60, Math.max(-24, resume.sectionSpacing ?? 0)),
    font: resolveFont(resume.font)?.id ?? null,
    // Tracking outside -0.5..0.5 breaks PDF text extraction (word boundaries
    // merge or split), and out-of-range line heights break layout.
    letterSpacing: Math.min(0.5, Math.max(-0.5, resume.letterSpacing ?? 0)),
    lineHeight: clampLineHeight(resume.lineHeight),
    nameScale: clampScale(resume.nameScale),
    titleScale: clampScale(resume.titleScale),
    bodyScale: clampScale(resume.bodyScale),
    headings: buildHeadings(resume, labels),
    sectionOrder,
    customSections,
    header: toHeaderView(resume),
    summary,
    experience: dated(jobItems(resume, "experience")),
    internship: dated(jobItems(resume, "internship")),
    projects: dated(
      A.map(entriesOfType(resume, "projects"), (entry) => {
        const website = plain(entry.fields.website);
        return {
          id: entry.id,
          role: plain(entry.fields.title),
          roleHref: website ? withHttps(website) : undefined,
          company: plain(entry.fields.company),
          startDate: plain(entry.fields.startDate),
          endDate: plain(entry.fields.endDate),
          description: richBlocks(entry.fields.description),
        };
      }),
    ),
    organizations: dated(
      A.map(entriesOfType(resume, "organizations"), (entry) => ({
        id: entry.id,
        role: plain(entry.fields.role),
        company: plain(entry.fields.organization),
        startDate: plain(entry.fields.startDate),
        endDate: plain(entry.fields.endDate),
        description: richBlocks(entry.fields.description),
      })),
    ),
    volunteering: dated(volunteeringItems(resume)),
    education: pipe(
      entriesOfType(resume, "education"),
      A.map((entry) => ({
        id: entry.id,
        degree: plain(entry.fields.degree),
        institution: plain(entry.fields.institution),
        location: plain(entry.fields.location),
        startDate: plain(entry.fields.startDate),
        endDate: plain(entry.fields.endDate),
        details: richBlocks(entry.fields.details),
      })),
      A.sort(byRecency),
      A.map(localizeDates),
    ),
    courses: dated(courseItems(resume)),
    certificates: A.map(entriesOfType(resume, "certifications"), (entry) => {
      const url = plain(entry.fields.url);
      return localizeDates({
        id: entry.id,
        title: plain(entry.fields.name),
        issuer: plain(entry.fields.issuer),
        href: url ? withHttps(url) : undefined,
        startDate: "",
        endDate: plain(entry.fields.date),
      });
    }),
    publications: dated(publicationItems(resume)),
    references: referenceItems(resume),
    skills: A.map(entriesOfType(resume, "skills"), (entry) => ({
      id: entry.id,
      name: plain(entry.fields.name),
      proficiency: skillsShowProficiency ? plain(entry.fields.level) : "",
      description: plain(entry.fields.description),
    })),
    skillsColumns: gridColumns(resume, "skills"),
    languages: A.map(entriesOfType(resume, "languages"), (entry) => ({
      id: entry.id,
      name: plain(entry.fields.name),
      proficiency: languagesShowProficiency ? plain(entry.fields.level) : "",
      skills: languagesShowProficiency ? languageSkillsLine(entry, labels) : "",
    })),
    languagesColumns: gridColumns(resume, "languages"),
    interests: interestBlocks(resume),
    driving: drivingBlocks(resume),
    salary: salaryBlocks(resume),
    availability: availabilityBlocks(resume),
  };
}
