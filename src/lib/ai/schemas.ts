import { z } from "zod";

/**
 * The JSON shape each AI task must answer with. Every field is required (an
 * empty string or list stands for "none") so the providers' structured
 * output modes can enforce the schema exactly.
 */

export const changeSchema = z.object({
  /** A path from the editable list, exactly as given. */
  path: z.string(),
  /** The full new text of the field. */
  after: z.string(),
  /** Why this is better, in one sentence, in the UI language. */
  reason: z.string(),
  /**
   * What the candidate must supply for a [placeholder] in `after`, or empty.
   */
  needsInput: z.string(),
});

export const changesResultSchema = z.object({
  changes: z.array(changeSchema),
  /** Questions for facts the résumé lacks; never answered by guessing. */
  questions: z.array(z.string()),
});

export const tailorResultSchema = changesResultSchema.extend({
  /**
   * Vacancy keywords the résumé omits although its content shows the skill;
   * `evidence` is the path of the field that shows it.
   */
  missingKeywords: z.array(
    z.object({ keyword: z.string(), evidence: z.string() }),
  ),
});

export const findingSchema = z.object({
  severity: z.enum(["high", "medium", "low"]),
  title: z.string(),
  detail: z.string(),
  fix: z.string(),
  /** The field the finding is about, or empty. */
  path: z.string(),
});

export const findingsResultSchema = z.object({
  summary: z.string(),
  findings: z.array(findingSchema),
  /** Safe mechanical fixes (spelling, punctuation) offered as changes. */
  changes: z.array(changeSchema),
});

export const letterResultSchema = z.object({
  subject: z.string(),
  /** Paragraphs in the markdown dialect, separated by blank lines. */
  body: z.string(),
  closing: z.string(),
  questions: z.array(z.string()),
});

export type AiChangeProposal = z.infer<typeof changeSchema>;
export type ChangesResult = z.infer<typeof changesResultSchema>;
export type TailorResult = z.infer<typeof tailorResultSchema>;
export type FindingsResult = z.infer<typeof findingsResultSchema>;
export type LetterResult = z.infer<typeof letterResultSchema>;
