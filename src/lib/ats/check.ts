import { A, D, O, pipe, S } from "@mobily/ts-belt";
import rules from "./ats-rules.json";
import { extractKeywords, matchKeywords } from "./keywords";
import {
  emailFormat,
  emailPresent,
  locationPresent,
  phoneFormat,
  phonePresent,
} from "./rules-contacts";
import {
  bulletsPerEntry,
  keywordsMatch,
  pageCount,
  quantifiedResults,
  repeatedWords,
  summaryLength,
  weakPhrases,
  wordCount,
} from "./rules-content";
import {
  datesConsistent,
  datesOrder,
  datesPresent,
  employmentGaps,
  employmentOverlaps,
} from "./rules-dates";
import { atsMode, emoji, letterSpacing, specialBullets } from "./rules-format";
import {
  headlinePresent,
  namePresent,
  requiredSections,
  sectionOrder,
  standardHeadings,
  summaryPresent,
} from "./rules-structure";
import type {
  AtsCategory,
  AtsConfig,
  AtsInput,
  AtsIssue,
  AtsReport,
  CategoryScore,
  RuleCheck,
  RuleConfig,
} from "./types";

/** The shipped rule set; its weights, thresholds, and word lists are data. */
export const ATS_CONFIG = rules as AtsConfig;

/** Rule implementations by the id the configuration refers to them with. */
export const RULE_CHECKS: Record<string, RuleCheck> = {
  "name-present": namePresent,
  "headline-present": headlinePresent,
  "required-sections": requiredSections,
  "summary-present": summaryPresent,
  "standard-headings": standardHeadings,
  "section-order": sectionOrder,
  "ats-mode": atsMode,
  "special-bullets": specialBullets,
  emoji,
  "letter-spacing": letterSpacing,
  "email-present": emailPresent,
  "email-format": emailFormat,
  "phone-present": phonePresent,
  "phone-format": phoneFormat,
  "location-present": locationPresent,
  "dates-present": datesPresent,
  "dates-consistent": datesConsistent,
  "dates-order": datesOrder,
  "employment-gaps": employmentGaps,
  "employment-overlaps": employmentOverlaps,
  "word-count": wordCount,
  "summary-length": summaryLength,
  "bullets-per-entry": bulletsPerEntry,
  "weak-phrases": weakPhrases,
  "repeated-words": repeatedWords,
  "quantified-results": quantifiedResults,
  "page-count": pageCount,
  "keywords-match": keywordsMatch,
};

interface RuleResult {
  rule: RuleConfig;
  score: number;
  issues: ReadonlyArray<AtsIssue>;
}

function runRule(
  rule: RuleConfig,
  input: AtsInput,
  config: AtsConfig,
): O.Option<RuleResult> {
  const check = RULE_CHECKS[rule.id];
  if (!check) return O.None;
  const outcome = check({ ...input, config, params: rule.params ?? {} });
  if (!outcome) return O.None;
  return O.Some({
    rule,
    score: Math.min(1, Math.max(0, outcome.score)),
    issues: A.map(outcome.issues, (issue) => ({
      ...issue,
      ruleId: rule.id,
      category: rule.category,
      severity: rule.severity,
    })),
  });
}

function categoryScore(
  results: ReadonlyArray<RuleResult>,
  weight: number,
): CategoryScore {
  const total = A.reduce(results, 0, (sum, result) => sum + result.rule.weight);
  if (total === 0) return { score: null, weight };
  const earned = A.reduce(
    results,
    0,
    (sum, result) => sum + result.rule.weight * result.score,
  );
  return { score: Math.round((earned / total) * 100), weight };
}

const SEVERITY_ORDER: Record<AtsIssue["severity"], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

/**
 * Runs every configured rule over the résumé and scores it 0..100. A category
 * with no applicable rule (no vacancy pasted, say) drops out of the total
 * rather than counting as a pass. Entirely local: no network, no AI.
 */
export function runAtsCheck(
  input: AtsInput,
  config: AtsConfig = ATS_CONFIG,
): AtsReport {
  const results = A.filterMap(config.rules, (rule) =>
    runRule(rule, input, config),
  );
  const categories = D.mapWithKey(config.categories, (category, value) =>
    categoryScore(
      A.filter(results, (result) => result.rule.category === category),
      value.weight,
    ),
  ) as Record<AtsCategory, CategoryScore>;
  const applicable = A.filter(D.values(categories), (c) => c.score !== null);
  const weightSum = A.reduce(applicable, 0, (sum, c) => sum + c.weight);
  const score =
    weightSum === 0
      ? 0
      : Math.round(
          A.reduce(applicable, 0, (sum, c) => sum + (c.score ?? 0) * c.weight) /
            weightSum,
        );
  const keywordRule = A.find(
    config.rules,
    (rule) => rule.id === "keywords-match",
  );
  const keywords = S.isEmpty(S.trim(input.jobDescription))
    ? null
    : matchKeywords(
        input.text,
        extractKeywords(
          input.jobDescription,
          config,
          O.mapWithDefault(keywordRule, 25, (rule) =>
            Number(rule.params?.topTerms ?? 25),
          ),
        ),
      );

  return {
    score,
    categories,
    issues: pipe(
      results,
      A.flatMap((result) => result.issues),
      A.sortBy((issue) => SEVERITY_ORDER[issue.severity]),
    ),
    keywords,
    passed: pipe(
      results,
      A.filter((result) => result.score === 1),
      A.map((result) => result.rule.id),
    ),
  };
}
