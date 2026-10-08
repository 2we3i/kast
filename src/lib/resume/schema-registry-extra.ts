import { PROSE_FEATURES, type SectionSchema } from "./schema-fields";

/** The optional section types added on top of the core set. */
export type ExtraSectionType =
  | "volunteering"
  | "courses"
  | "publications"
  | "references"
  | "interests"
  | "driving"
  | "salary"
  | "availability";

/** Stored values of the salary section's `period` select. */
export const SALARY_PERIODS: ReadonlyArray<string> = ["month", "year", "hour"];

/** Stored values of the salary section's `tax` select. */
export const SALARY_TAX: ReadonlyArray<string> = ["gross", "net"];

/** Stored values of the availability section's `status` select. */
export const AVAILABILITY_STATUSES: ReadonlyArray<string> = [
  "immediately",
  "notice",
  "from-date",
  "open",
  "not-looking",
];

/** Stored values of the availability section's `relocation` select. */
export const RELOCATION_OPTIONS: ReadonlyArray<string> = ["yes", "no"];

/**
 * The optional sections. Repeating ones reuse the experience-like entry shape
 * (title, subtitle, dates, rich description) so every template and export
 * draws them without new block kinds; the singletons render as one short
 * paragraph composed from their fields in the document's language.
 */
export const EXTRA_SECTION_REGISTRY: Record<ExtraSectionType, SectionSchema> = {
  volunteering: {
    type: "volunteering",
    defaultTitle: "Volunteering",
    singleton: false,
    fields: [
      { key: "role", label: "Role", kind: "plain", placeholder: "Mentor" },
      {
        key: "organization",
        label: "Organization",
        kind: "plain",
        placeholder: "Code Club",
      },
      { key: "location", label: "Location", kind: "plain", placeholder: "" },
      { key: "startDate", label: "Start date", kind: "plain", input: "date" },
      { key: "endDate", label: "End date", kind: "plain", input: "date" },
      {
        key: "description",
        label: "Description",
        kind: "richtext",
        features: PROSE_FEATURES,
      },
    ],
  },
  courses: {
    type: "courses",
    defaultTitle: "Courses",
    singleton: false,
    fields: [
      {
        key: "title",
        label: "Course",
        kind: "plain",
        placeholder: "Advanced TypeScript",
      },
      {
        key: "provider",
        label: "Provider",
        kind: "plain",
        placeholder: "Frontend Masters",
      },
      { key: "url", label: "Course URL", kind: "plain", input: "url" },
      { key: "startDate", label: "Start date", kind: "plain", input: "date" },
      { key: "endDate", label: "End date", kind: "plain", input: "date" },
      {
        key: "description",
        label: "Description",
        kind: "richtext",
        features: PROSE_FEATURES,
      },
    ],
  },
  publications: {
    type: "publications",
    defaultTitle: "Publications",
    singleton: false,
    fields: [
      {
        key: "title",
        label: "Title",
        kind: "plain",
        placeholder: "Designing for parsers",
      },
      {
        key: "publisher",
        label: "Publisher",
        kind: "plain",
        placeholder: "Smashing Magazine",
      },
      { key: "url", label: "URL", kind: "plain", input: "url" },
      { key: "date", label: "Date", kind: "plain", input: "date" },
      {
        key: "description",
        label: "Description",
        kind: "richtext",
        features: PROSE_FEATURES,
      },
    ],
  },
  references: {
    type: "references",
    defaultTitle: "References",
    singleton: false,
    fields: [
      { key: "name", label: "Name", kind: "plain", placeholder: "Jane Roe" },
      {
        key: "position",
        label: "Position",
        kind: "plain",
        placeholder: "Engineering Manager",
      },
      { key: "company", label: "Company", kind: "plain", placeholder: "Acme" },
      { key: "email", label: "Email", kind: "plain", input: "email" },
      { key: "phone", label: "Phone", kind: "plain", input: "phone" },
    ],
  },
  interests: {
    type: "interests",
    defaultTitle: "Interests",
    singleton: true,
    fields: [
      {
        key: "body",
        label: "Interests",
        kind: "richtext",
        features: PROSE_FEATURES,
      },
    ],
  },
  driving: {
    type: "driving",
    defaultTitle: "Driving licence",
    singleton: true,
    fields: [
      {
        key: "categories",
        label: "Categories",
        kind: "plain",
        placeholder: "B, C",
      },
      {
        key: "note",
        label: "Note",
        kind: "plain",
        placeholder: "Own car",
      },
    ],
  },
  salary: {
    type: "salary",
    defaultTitle: "Expected salary",
    singleton: true,
    fields: [
      { key: "amount", label: "Amount", kind: "plain", placeholder: "2500" },
      { key: "currency", label: "Currency", kind: "plain", placeholder: "EUR" },
      {
        key: "period",
        label: "Per",
        kind: "plain",
        input: "select",
        options: SALARY_PERIODS,
      },
      {
        key: "tax",
        label: "Before or after tax",
        kind: "plain",
        input: "select",
        options: SALARY_TAX,
      },
    ],
  },
  availability: {
    type: "availability",
    defaultTitle: "Availability",
    singleton: true,
    fields: [
      {
        key: "status",
        label: "Status",
        kind: "plain",
        input: "select",
        options: AVAILABILITY_STATUSES,
      },
      { key: "from", label: "Available from", kind: "plain", input: "date" },
      {
        key: "notice",
        label: "Notice period",
        kind: "plain",
        placeholder: "2 weeks",
      },
      {
        key: "workType",
        label: "Work type",
        kind: "plain",
        placeholder: "Full-time, hybrid",
      },
      {
        key: "relocation",
        label: "Relocation",
        kind: "plain",
        input: "select",
        options: RELOCATION_OPTIONS,
      },
    ],
  },
};
