import { A, G, O, pipe, S } from "@mobily/ts-belt";
import {
  DATED_TYPES,
  entriesOfTypes,
  entryLabel,
  JOB_TYPES,
  type LocatedEntry,
  type ParsedDate,
  parseStoredDate,
  plain,
} from "./read";
import type { RuleCheck, RuleContext } from "./types";

interface Range {
  located: LocatedEntry;
  start: ParsedDate;
  end: ParsedDate;
}

function now(context: RuleContext): Date {
  return context.now ?? new Date();
}

function datedEntries(context: RuleContext): ReadonlyArray<LocatedEntry> {
  return A.filter(
    entriesOfTypes(context.resume, DATED_TYPES),
    (located) => entryLabel(located.entry) !== "—",
  );
}

function rangeOf(located: LocatedEntry, today: Date): O.Option<Range> {
  const start = parseStoredDate(plain(located.entry.fields.startDate), today);
  const end = parseStoredDate(plain(located.entry.fields.endDate), today);
  if (!start || !end) return O.None;
  return O.Some({ located, start, end });
}

function target(located: LocatedEntry) {
  return {
    sectionType: located.section.type,
    sectionId: located.section.id,
    entryId: located.entry.id,
  };
}

const monthLabel = (ordinal: number) =>
  `${String((ordinal % 12) + 1).padStart(2, "0")}/${Math.floor(ordinal / 12)}`;

export const datesPresent: RuleCheck = (context) => {
  const entries = datedEntries(context);
  if (A.isEmpty(entries)) return null;
  const undated = A.filter(
    entries,
    (located) =>
      S.isEmpty(plain(located.entry.fields.startDate)) &&
      S.isEmpty(plain(located.entry.fields.endDate)),
  );
  return {
    score: 1 - A.length(undated) / A.length(entries),
    issues: A.map(undated, (located) => ({
      params: { entry: entryLabel(located.entry) },
      target: target(located),
    })),
  };
};

/** Month-and-year everywhere, or year-only everywhere; not a mix. */
export const datesConsistent: RuleCheck = (context) => {
  const today = now(context);
  const precisions = pipe(
    datedEntries(context),
    A.flatMap((located) => [
      plain(located.entry.fields.startDate),
      plain(located.entry.fields.endDate),
    ]),
    A.reject((value) => value === "Present"),
    A.map((value) => parseStoredDate(value, today)),
    A.filter(G.isNotNullable),
    A.map((date) => date.precision),
    A.uniq,
  );
  if (A.length(precisions) < 2)
    return precisions.length ? { score: 1, issues: [] } : null;
  return { score: 0.5, issues: [{}] };
};

export const datesOrder: RuleCheck = (context) => {
  const today = now(context);
  const ranges = A.filterMap(datedEntries(context), (located) =>
    rangeOf(located, today),
  );
  if (A.isEmpty(ranges)) return null;
  const reversed = A.filter(
    ranges,
    (range) => range.start.ordinal > range.end.ordinal,
  );
  return {
    score: 1 - A.length(reversed) / A.length(ranges),
    issues: A.map(reversed, (range) => ({
      params: { entry: entryLabel(range.located.entry) },
      target: target(range.located),
    })),
  };
};

function jobRanges(context: RuleContext): ReadonlyArray<Range> {
  const today = now(context);
  return pipe(
    entriesOfTypes(context.resume, JOB_TYPES),
    A.filterMap((located) => rangeOf(located, today)),
    A.filter((range) => range.start.ordinal <= range.end.ordinal),
    A.sortBy((range) => range.start.ordinal),
  );
}

/** Gaps between jobs longer than the configured months, oldest first. */
export const employmentGaps: RuleCheck = (context) => {
  const ranges = jobRanges(context);
  if (A.length(ranges) < 2) return null;
  const limit = Number(context.params.months);
  const gaps = A.reduce(
    A.drop(ranges, 1),
    {
      coveredUntil: O.mapWithDefault(A.head(ranges), 0, (r) => r.end.ordinal),
      found: [] as ReadonlyArray<{ from: number; to: number }>,
    },
    (acc, range) => {
      const gap = range.start.ordinal - acc.coveredUntil - 1;
      return {
        coveredUntil: Math.max(acc.coveredUntil, range.end.ordinal),
        found:
          gap > limit
            ? A.append(acc.found, {
                from: acc.coveredUntil + 1,
                to: range.start.ordinal - 1,
              })
            : acc.found,
      };
    },
  ).found;
  return {
    score: A.isEmpty(gaps) ? 1 : 0.5,
    issues: A.map(gaps, (gap) => ({
      params: {
        from: monthLabel(gap.from),
        to: monthLabel(gap.to),
        months: gap.to - gap.from + 1,
      },
    })),
  };
};

/** Two jobs running in parallel for longer than the configured months. */
export const employmentOverlaps: RuleCheck = (context) => {
  const ranges = jobRanges(context);
  if (A.length(ranges) < 2) return null;
  const limit = Number(context.params.months);
  const pairs = A.flatMap(ranges, (range) =>
    pipe(
      ranges,
      A.filter(
        (other) =>
          other.start.ordinal > range.start.ordinal &&
          Math.min(range.end.ordinal, other.end.ordinal) -
            other.start.ordinal +
            1 >
            limit,
      ),
      A.map((other) => ({ first: range, second: other })),
    ),
  );
  return {
    score: A.isEmpty(pairs) ? 1 : 0.75,
    issues: A.map(pairs, (pair) => ({
      params: {
        first: entryLabel(pair.first.located.entry),
        second: entryLabel(pair.second.located.entry),
      },
      target: target(pair.second.located),
    })),
  };
};
