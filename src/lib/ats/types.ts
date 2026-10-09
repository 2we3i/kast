import type { Resume, SectionType } from "@/lib/resume/types";

export type AtsCategory =
  | "structure"
  | "format"
  | "contacts"
  | "dates"
  | "content"
  | "keywords";

export type AtsSeverity = "error" | "warning" | "info";

/** Where an issue points, so the UI can open the right section. */
export interface AtsTarget {
  sectionType?: SectionType;
  sectionId?: string;
  entryId?: string;
}

/**
 * One problem found. `ruleId` keys its title and its fix text in the UI
 * messages (`ats.rules.<ruleId>`); `params` fill their placeholders.
 */
export interface AtsIssue {
  ruleId: string;
  category: AtsCategory;
  severity: AtsSeverity;
  params?: Record<string, string | number>;
  target?: AtsTarget;
}

/** A rule's verdict: 1 is a clean pass, 0 a full fail. */
export interface RuleOutcome {
  score: number;
  issues: ReadonlyArray<Omit<AtsIssue, "ruleId" | "category" | "severity">>;
}

export interface RuleConfig {
  id: string;
  category: AtsCategory;
  severity: AtsSeverity;
  weight: number;
  params?: Record<string, unknown>;
}

export interface AtsConfig {
  version: number;
  categories: Record<AtsCategory, { weight: number }>;
  rules: ReadonlyArray<RuleConfig>;
  stopwords: Record<string, ReadonlyArray<string>>;
  standardHeadings: Record<string, ReadonlyArray<string>>;
}

export interface AtsInput {
  resume: Resume;
  /** The résumé as plain text in reading order (the TXT export). */
  text: string;
  /** Pages the paginated preview fills. */
  pageCount: number;
  /** Pasted vacancy text; empty skips the keyword category. */
  jobDescription: string;
  /** "Today" for date checks, injectable for tests. */
  now?: Date;
}

export interface RuleContext extends AtsInput {
  config: AtsConfig;
  params: Record<string, unknown>;
}

/**
 * A rule implementation. Returning null means "does not apply here" (no
 * vacancy pasted, no dated entries), which removes its weight from the score
 * instead of counting it as a pass or a fail.
 */
export type RuleCheck = (context: RuleContext) => RuleOutcome | null;

export interface KeywordReport {
  found: ReadonlyArray<string>;
  missing: ReadonlyArray<string>;
}

export interface CategoryScore {
  /** 0..100, or null when no rule of the category applied. */
  score: number | null;
  weight: number;
}

export interface AtsReport {
  /** 0..100 over the categories that applied. */
  score: number;
  categories: Record<AtsCategory, CategoryScore>;
  issues: ReadonlyArray<AtsIssue>;
  keywords: KeywordReport | null;
  /** Rules that passed cleanly, for the "what's already good" list. */
  passed: ReadonlyArray<string>;
}
