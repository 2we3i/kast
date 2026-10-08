import { A, D, pipe } from "@mobily/ts-belt";
import { z } from "zod";
import {
  CUSTOM_LIST_FIELDS,
  type FieldSchema,
  HEADER_SCHEMA,
  SECTION_REGISTRY,
  type SectionType,
} from "@/lib/resume";

export const INTERCHANGE_FORMAT = "kast-resume";
/** Files from before the rename carry this format id; they import the same. */
export const LEGACY_INTERCHANGE_FORMAT = "lanjut-resume";
export const INTERCHANGE_VERSION = 2;

/**
 * The human-editable interchange shape shared by every serialization (JSON now,
 * YAML later). Rich text fields are strings in the interchange markdown dialect
 * (see markdown.ts); field keys come straight from the schema registry. Objects
 * are strict so a typo'd key surfaces as an error instead of vanishing.
 */

/**
 * Data fields accept bare numbers and stringify them, so a hand-typed YAML
 * scalar like `endDate: 2016` imports as the string it was meant to be.
 */
const scalarString = z
  .union([z.string(), z.number()])
  .transform((value) => String(value));

function entryShape(fields: FieldSchema[]) {
  const shape = pipe(
    fields,
    A.map((field): readonly [string, z.ZodOptional<typeof scalarString>] => [
      field.key,
      scalarString.optional(),
    ]),
    D.fromPairs,
  );
  return z.strictObject(shape);
}

function bodySection<T extends "summary" | "interests">(type: T) {
  return z.strictObject({
    type: z.literal(type),
    title: z.string().optional(),
    hidden: z.boolean().optional(),
    body: scalarString.optional(),
  });
}

function listSection<T extends SectionType>(type: T) {
  return z.strictObject({
    type: z.literal(type),
    title: z.string().optional(),
    hidden: z.boolean().optional(),
    entries: z.array(entryShape(SECTION_REGISTRY[type].fields)).optional(),
  });
}

/** Skills and Languages carry the grid's presentation-only toggles. */
function gridSection<T extends SectionType>(type: T) {
  return z.strictObject({
    type: z.literal(type),
    title: z.string().optional(),
    hidden: z.boolean().optional(),
    entries: z.array(entryShape(SECTION_REGISTRY[type].fields)).optional(),
    columns: z.union([z.literal(1), z.literal(2)]).optional(),
    showProficiency: z.boolean().optional(),
  });
}

const customSection = z.strictObject({
  type: z.literal("custom"),
  variant: z.enum(["rich", "list"]).optional(),
  title: z.string().optional(),
  hidden: z.boolean().optional(),
  body: scalarString.optional(),
  entries: z.array(entryShape(CUSTOM_LIST_FIELDS)).optional(),
});

const sectionSchema = z.discriminatedUnion("type", [
  bodySection("summary"),
  listSection("experience"),
  listSection("internship"),
  listSection("projects"),
  listSection("organizations"),
  listSection("volunteering"),
  listSection("education"),
  listSection("courses"),
  listSection("certifications"),
  listSection("publications"),
  gridSection("skills"),
  gridSection("languages"),
  bodySection("interests"),
  listSection("references"),
  listSection("driving"),
  listSection("salary"),
  listSection("availability"),
  customSection,
]);

const jobTargetSchema = z.strictObject({
  company: z.string().optional(),
  position: z.string().optional(),
  url: z.string().optional(),
  appliedAt: z.string().optional(),
  status: z
    .enum(["draft", "applied", "interview", "offer", "rejected"])
    .optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
});

const coverLetterSchema = z.strictObject({
  recipient: z.string().optional(),
  company: z.string().optional(),
  date: z.string().optional(),
  subject: z.string().optional(),
  /** Markdown in the interchange dialect, like every rich field. */
  body: z.string().optional(),
  closing: z.string().optional(),
});

/** Résumé languages; "id" from files of the previous product reads as English. */
const languageSchema = z.preprocess(
  (value) => (value === "id" ? "en" : value),
  z.enum(["en", "lt", "ru"]),
);

export const interchangeSchema = z
  .strictObject({
    format: z.union([
      z.literal(INTERCHANGE_FORMAT),
      z.literal(LEGACY_INTERCHANGE_FORMAT),
    ]),
    version: z.union([z.literal(1), z.literal(INTERCHANGE_VERSION)]),
    title: z.string().optional(),
    template: z.string().optional(),
    language: languageSchema.optional(),
    atsMode: z.boolean().optional(),
    accentColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .optional(),
    showQr: z.boolean().optional(),
    target: jobTargetSchema.optional(),
    coverLetter: coverLetterSchema.optional(),
    showIcons: z.boolean().optional(),
    sectionSpacing: z.number().int().min(-24).max(60).optional(),
    font: z.string().optional(),
    letterSpacing: z.number().min(-0.5).max(0.5).optional(),
    lineHeight: z.number().min(1.2).max(2).optional(),
    nameScale: z.number().min(0.8).max(1.2).optional(),
    titleScale: z.number().min(0.8).max(1.2).optional(),
    bodyScale: z.number().min(0.8).max(1.2).optional(),
    header: entryShape(HEADER_SCHEMA).optional(),
    /** Opt-in portrait as a data URL; kept out of the header field map since it is not text. */
    photo: z
      .string()
      .regex(/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/=]+$/)
      .optional(),
    photoSize: z.number().min(40).max(96).optional(),
    photoRadius: z.number().min(0).max(50).optional(),
    photoAlign: z.enum(["top", "center", "bottom"]).optional(),
    sections: z.array(sectionSchema).optional(),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    A.forEachWithIndex(value.sections ?? [], (index, section) => {
      if (section.type === "custom") {
        const variant = section.variant ?? "rich";
        if (variant === "rich" && section.entries !== undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["sections", index, "entries"],
            message: 'a "rich" custom section uses "body", not "entries"',
          });
        }
        if (variant === "list" && section.body !== undefined) {
          ctx.addIssue({
            code: "custom",
            path: ["sections", index, "body"],
            message: 'a "list" custom section uses "entries", not "body"',
          });
        }
        return;
      }
      if (seen.has(section.type)) {
        ctx.addIssue({
          code: "custom",
          path: ["sections", index, "type"],
          message: `duplicate "${section.type}" section`,
        });
      }
      seen.add(section.type);
    });
  });

export type InterchangeResume = z.infer<typeof interchangeSchema>;
export type InterchangeSection = NonNullable<
  InterchangeResume["sections"]
>[number];
