import { A, S } from "@mobily/ts-belt";
import { type HeadingKind, headingKind } from "./dictionary";
import { isBullet, type TextRow } from "./import-rows";

/** A run of rows under one heading; `kind` "preamble" is the top of page 1. */
export interface RawSection {
  kind: HeadingKind | "preamble" | "custom";
  title: string;
  rows: ReadonlyArray<TextRow>;
}

function words(text: string): number {
  return A.length(A.reject(S.split(S.trim(text), " "), S.isEmpty));
}

/**
 * A heading row: its whole text names a known section (in any of the three
 * languages), or, once a known section has started, it is bold and set as
 * large as the known headings are. Measuring against the known headings
 * rather than the body keeps bold job titles, a size between the two, from
 * opening sections of their own.
 */
function headingOf(
  row: TextRow,
  bodySize: number,
  headingSize: number | null,
): { kind: RawSection["kind"]; title: string; rest: TextRow | null } | null {
  // A label naming a section ("Laisvalaikio pomėgiai" beside its text) opens
  // that section with the text beside it as its first row.
  if (row.label && headingKind(row.label)) {
    const rest = S.isEmpty(row.text) ? null : { ...row, label: "" };
    return { kind: headingKind(row.label) ?? "custom", title: row.label, rest };
  }
  const text = S.trim(`${row.label} ${row.text}`);
  if (S.isEmpty(text) || words(text) > 7) return null;
  const kind = headingKind(text);
  if (kind) return { kind, title: text, rest: null };
  const looksLikeHeading =
    headingSize !== null &&
    row.bold &&
    row.size >= Math.max(bodySize * 1.15, headingSize - 0.5) &&
    !isBullet(text) &&
    !/\d/.test(text) &&
    !/[.,;]$/.test(text);
  return looksLikeHeading ? { kind: "custom", title: text, rest: null } : null;
}

/** Splits a stream of rows into its sections, in reading order. */
export function splitSections(
  rows: ReadonlyArray<TextRow>,
  bodySize: number,
): ReadonlyArray<RawSection> {
  const initial = {
    sections: [
      { kind: "preamble", title: "", rows: [] },
    ] as ReadonlyArray<RawSection>,
    /** The size of the first known heading, once one has been seen. */
    headingSize: null as number | null,
    labelHeading: null as TextRow | null,
  };
  return A.reduce(rows, initial, (acc, row) => {
    // A label heading that wraps ("Vairuotojo pažymėjimas /" over
    // "kategorija (neprivaloma):") continues on a label-only line.
    const previous = acc.labelHeading;
    if (
      previous &&
      S.isNotEmpty(row.label) &&
      S.isEmpty(row.text) &&
      row.page === previous.page &&
      row.top - previous.top <= row.size * 1.8
    ) {
      return { ...acc, labelHeading: row };
    }
    const heading = headingOf(row, bodySize, acc.headingSize);
    if (heading) {
      return {
        sections: A.append(acc.sections, {
          kind: heading.kind,
          title: heading.title,
          rows: heading.rest ? [heading.rest] : [],
        }),
        headingSize:
          acc.headingSize ?? (heading.kind === "custom" ? null : row.size),
        labelHeading: S.isNotEmpty(row.label) ? row : null,
      };
    }
    const index = acc.sections.length - 1;
    const current = acc.sections[index];
    if (!current) return acc;
    return {
      ...acc,
      labelHeading: null,
      sections: A.replaceAt(acc.sections, index, {
        ...current,
        rows: A.append(current.rows, row),
      }),
    };
  }).sections;
}
