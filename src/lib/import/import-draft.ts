import type { Resume } from "@/lib/resume/types";
import type { LayoutKind } from "./layout-columns";
import type { RemovedLine } from "./layout-furniture";

/**
 * Text the import kept as metadata rather than content: tenure badges
 * ("6 mėnesiai"), level badges ("Lygis Įgudęs"), field labels, contract types.
 */
export interface ImportMetadata {
  kind: "duration" | "level" | "label" | "contract";
  text: string;
}

/**
 * How sure the parser is of each field it filled, 0..1, keyed by
 * "header/<field>" or "<entryId>/<field>". The review screen highlights the
 * fields under REVIEW_THRESHOLD for a human to check.
 */
export type ConfidenceMap = Record<string, number>;

export const REVIEW_THRESHOLD = 0.6;

/** A parsed PDF waiting for the user's review; nothing is saved yet. */
export interface ImportDraft {
  resume: Resume;
  confidence: ConfidenceMap;
  metadata: ReadonlyArray<ImportMetadata>;
  removed: ReadonlyArray<RemovedLine>;
  /** Text that fit nowhere, offered for copying in. */
  leftovers: string[];
  layout: LayoutKind;
  /** The PDF's text in reading order, one line per row. */
  text: string;
}

/** One section parser's output, merged into the draft. */
export interface Parsed<T> {
  value: T;
  confidence: ConfidenceMap;
  metadata: ReadonlyArray<ImportMetadata>;
  leftovers: ReadonlyArray<string>;
}

export function parsed<T>(
  value: T,
  extra: Partial<Omit<Parsed<T>, "value">> = {},
): Parsed<T> {
  return {
    value,
    confidence: extra.confidence ?? {},
    metadata: extra.metadata ?? [],
    leftovers: extra.leftovers ?? [],
  };
}
