import type { FieldKey, SectionType } from "./types";

/**
 * The allowed TipTap features for a richtext Field: the Restricted schema
 * allowlist. Base document/paragraph/text are always implied. Both typing and
 * paste are filtered through this list so disallowed structure (tables, headings,
 * images) cannot be represented or pasted in.
 */
export type RichTextFeature =
  | "bold"
  | "italic"
  | "bulletList"
  | "orderedList"
  | "link";

/**
 * How the generic section editor draws a plain field. `text` is a free input,
 * `date` the month/year picker, `select` a closed list of `options` whose
 * values are stored as written (and rendered through the document labels).
 */
export type PlainFieldInput =
  | "text"
  | "url"
  | "email"
  | "phone"
  | "date"
  | "select";

interface PlainFieldSchema {
  key: FieldKey;
  label: string;
  kind: "plain";
  placeholder?: string;
  input?: PlainFieldInput;
  /** Allowed values for a `select` input. */
  options?: ReadonlyArray<string>;
}

interface RichTextFieldSchema {
  key: FieldKey;
  label: string;
  kind: "richtext";
  features: RichTextFeature[];
}

export type FieldSchema = PlainFieldSchema | RichTextFieldSchema;

export interface SectionSchema {
  type: SectionType;
  defaultTitle: string;
  /** Singleton sections (summary, interests) hold exactly one Entry; others repeat. */
  singleton: boolean;
  /** The Field shape of every Entry in this Section. */
  fields: FieldSchema[];
}

/** The default richtext allowlist shared by most body fields. */
export const PROSE_FEATURES: RichTextFeature[] = [
  "bold",
  "italic",
  "bulletList",
  "orderedList",
  "link",
];

/**
 * Common European Framework levels for the three language skills, plus
 * "native". Stored as written; the document renders them as they are.
 */
export const LANGUAGE_SKILL_LEVELS: ReadonlyArray<string> = [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
  "C2",
  "native",
];
