import { A, D, O, pipe, S } from "@mobily/ts-belt";
import { extractKeywords, matchKeywords } from "./keywords";
import {
  bulletLines,
  DESCRIBED_TYPES,
  entriesOf,
  entriesOfTypes,
  entryLabel,
  rich,
  richLines,
} from "./read";
import type { RuleCheck, RuleContext } from "./types";

function words(text: string): ReadonlyArray<string> {
  return Array.from(
    text.matchAll(/[\p{L}\p{N}][\p{L}\p{N}'-]*/gu),
    (m) => m[0],
  );
}

function summaryText(context: RuleContext): string {
  return O.mapWithDefault(
    A.head(entriesOf(context.resume, "summary")),
    "",
    (entry) => A.join(richLines(rich(entry.fields.body)), " "),
  );
}

/** Every rich line a recruiter reads: the summary and each description. */
function proseLines(context: RuleContext): ReadonlyArray<string> {
  const descriptions = A.flatMap(
    entriesOfTypes(context.resume, DESCRIBED_TYPES),
    (located) => richLines(rich(located.entry.fields.description)),
  );
  return A.reject(A.prepend(descriptions, summaryText(context)), S.isEmpty);
}

/** Too little text gives a parser nothing to match; too much buries it. */
export const wordCount: RuleCheck = (context) => {
  const count = A.length(words(context.text));
  const min = Number(context.params.min);
  const max = Number(context.params.max);
  if (count < min) {
    return {
      score: count / min,
      issues: [{ params: { count, min, max, kind: "short" } }],
    };
  }
  if (count > max) {
    return {
      score: 0.5,
      issues: [{ params: { count, min, max, kind: "long" } }],
    };
  }
  return { score: 1, issues: [] };
};

export const summaryLength: RuleCheck = (context) => {
  const text = summaryText(context);
  if (S.isEmpty(text)) return null;
  const count = A.length(words(text));
  const min = Number(context.params.minWords);
  const max = Number(context.params.maxWords);
  if (count < min) {
    return {
      score: 0.5,
      issues: [{ params: { count, min, max, kind: "short" } }],
    };
  }
  if (count > max) {
    return {
      score: 0.5,
      issues: [{ params: { count, min, max, kind: "long" } }],
    };
  }
  return { score: 1, issues: [] };
};

export const bulletsPerEntry: RuleCheck = (context) => {
  const entries = A.filter(
    entriesOfTypes(context.resume, ["experience", "internship"]),
    (located) => entryLabel(located.entry) !== "—",
  );
  if (A.isEmpty(entries)) return null;
  const min = Number(context.params.min);
  const max = Number(context.params.max);
  const off = A.filterMap(entries, (located) => {
    const count = A.length(bulletLines(rich(located.entry.fields.description)));
    if (count >= min && count <= max) return O.None;
    return O.Some({
      params: { entry: entryLabel(located.entry), count, min, max },
      target: {
        sectionType: located.section.type,
        sectionId: located.section.id,
        entryId: located.entry.id,
      },
    });
  });
  return { score: 1 - A.length(off) / A.length(entries), issues: off };
};

export const weakPhrases: RuleCheck = (context) => {
  const lines = proseLines(context);
  if (A.every(lines, S.isEmpty)) return null;
  const lists = context.params.phrases as Record<string, ReadonlyArray<string>>;
  const phrases = A.uniq(
    A.concat(lists[context.resume.language] ?? [], lists.en ?? []),
  );
  const text = S.toLowerCase(A.join(lines, "\n"));
  const found = A.filter(phrases, (phrase) => S.includes(text, phrase));
  return {
    score: A.isEmpty(found) ? 1 : Math.max(0, 1 - A.length(found) * 0.25),
    issues: A.map(found, (phrase) => ({ params: { phrase } })),
  };
};

export const repeatedWords: RuleCheck = (context) => {
  const minLength = Number(context.params.minLength);
  const maxRepeats = Number(context.params.maxRepeats);
  const stop = new Set(A.flat(D.values(context.config.stopwords)));
  const counts = pipe(
    proseLines(context),
    A.flatMap(words),
    A.map(S.toLowerCase),
    A.filter((word) => S.length(word) >= minLength && !stop.has(word)),
    A.groupBy((word) => word),
    D.map((group) => A.length(group ?? [])),
    D.toPairs,
    A.filter(([, count]) => count > maxRepeats),
    A.sort(([, a], [, b]) => b - a),
    A.take(3),
  );
  if (A.isEmpty(counts)) return { score: 1, issues: [] };
  return {
    score: 0.5,
    issues: A.map(counts, ([word, count]) => ({ params: { word, count } })),
  };
};

/** Bullets with a number in them: percentages, money, team sizes, counts. */
export const quantifiedResults: RuleCheck = (context) => {
  const bullets = A.flatMap(
    entriesOfTypes(context.resume, DESCRIBED_TYPES),
    (located) => bulletLines(rich(located.entry.fields.description)),
  );
  if (A.length(bullets) < Number(context.params.minBullets)) return null;
  const withNumbers = A.filter(bullets, (line) => /\d/.test(line));
  const ratio = A.length(withNumbers) / A.length(bullets);
  const minRatio = Number(context.params.minRatio);
  if (ratio >= minRatio) return { score: 1, issues: [] };
  return {
    score: ratio / minRatio,
    issues: [
      {
        params: {
          percent: Math.round(ratio * 100),
          target: Math.round(minRatio * 100),
        },
      },
    ],
  };
};

export const pageCount: RuleCheck = (context) => {
  if (context.pageCount === 0) return null;
  const max = Number(context.params.maxPages);
  const ok = context.pageCount <= max;
  return {
    score: ok ? 1 : 0.5,
    issues: ok ? [] : [{ params: { pages: context.pageCount, max } }],
  };
};

export const keywordsMatch: RuleCheck = (context) => {
  if (S.isEmpty(S.trim(context.jobDescription))) return null;
  const keywords = extractKeywords(
    context.jobDescription,
    context.config,
    Number(context.params.topTerms),
  );
  if (A.isEmpty(keywords)) return null;
  const report = matchKeywords(context.text, keywords);
  const ratio = A.length(report.found) / A.length(keywords);
  const good = Number(context.params.goodRatio);
  return {
    score: Math.min(1, ratio / good),
    issues:
      ratio >= good
        ? []
        : [
            {
              params: {
                percent: Math.round(ratio * 100),
                missing: A.join(A.take(report.missing, 8), ", "),
              },
            },
          ],
  };
};
