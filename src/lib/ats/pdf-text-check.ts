import { A, pipe, S } from "@mobily/ts-belt";
import type { ResumeBlock } from "@/components/editor/resume-blocks";

/**
 * The "Export" category of the ATS check: does the PDF carry a real text
 * layer, and does it read in the order the résumé is written? The values a
 * parser must find (name, headline, contacts, headings, roles, employers,
 * schools, certificates, skills) are taken from the document's own blocks in
 * reading order, then looked up in the text extracted from the rendered PDF.
 */

export interface PdfTextReport {
  /** How many values were looked for. */
  total: number;
  /** Values the extracted text does not contain at all. */
  missing: ReadonlyArray<string>;
  /** Whether the values that were found appear in reading order. */
  inOrder: boolean;
}

/**
 * One value a parser must find. Header contacts often sit in a column of
 * their own beside the name, so only their presence counts; everything else
 * must also come in reading order.
 */
export interface ExpectedValue {
  value: string;
  ordered: boolean;
}

/** Lowercase with runs of whitespace collapsed, so wrapping never matters. */
export function normalizeText(text: string): string {
  return pipe(text, S.toLowerCase, S.replaceByRe(/\s+/g, " "), S.trim);
}

function blockValues(block: ResumeBlock): ReadonlyArray<string> {
  switch (block.kind) {
    case "header":
      return [block.header.fullName];
    case "heading":
      return [block.title];
    case "experience":
      return [block.item.role, block.item.company];
    case "education":
      return [block.item.degree, block.item.institution];
    case "certificate":
      return [block.item.title];
    case "skills":
      return A.map(A.take(block.items, 3), (item) => item.name);
    case "languages":
      return A.map(A.take(block.items, 2), (item) => item.name);
    case "summary":
      return [];
  }
}

function headerExtras(block: ResumeBlock): ReadonlyArray<string> {
  if (block.kind !== "header") return [];
  return A.concat(
    [block.header.headline],
    A.filterMap(block.header.contacts, (contact) =>
      contact.kind === "email" || contact.kind === "phone"
        ? contact.value
        : undefined,
    ),
  );
}

/** The values a parser must find, in reading order, without blanks. */
export function expectedValues(
  blocks: ReadonlyArray<ResumeBlock>,
): ReadonlyArray<ExpectedValue> {
  const clean = (values: ReadonlyArray<string>) =>
    A.filter(A.map(values, S.trim), S.isNotEmpty);
  return A.concat(
    A.map(
      clean(A.flat(A.map(blocks, headerExtras))),
      (value): ExpectedValue => ({ value, ordered: false }),
    ),
    A.map(
      clean(A.flat(A.map(blocks, blockValues))),
      (value): ExpectedValue => ({ value, ordered: true }),
    ),
  );
}

/**
 * Looks every value up in the extracted text. A value that appears is
 * matched at its first occurrence after the previous match, so a repeated
 * word (a role held twice) does not break the order check.
 */
export function checkPdfText(
  text: string,
  expected: ReadonlyArray<ExpectedValue>,
): PdfTextReport {
  const haystack = normalizeText(text);
  // ts-belt's S.indexOf has no start position; the order check needs one.
  const result = A.reduce(
    expected,
    { cursor: 0, missing: [] as ReadonlyArray<string>, inOrder: true },
    (state, { value, ordered }) => {
      const needle = normalizeText(value);
      if (!ordered) {
        return haystack.includes(needle)
          ? state
          : { ...state, missing: A.append(state.missing, value) };
      }
      const next = haystack.indexOf(needle, state.cursor);
      if (next >= 0) {
        return { ...state, cursor: next + needle.length };
      }
      const anywhere = haystack.indexOf(needle);
      if (anywhere >= 0) return { ...state, inOrder: false };
      return { ...state, missing: A.append(state.missing, value) };
    },
  );
  return {
    total: A.length(expected),
    missing: result.missing,
    inOrder: result.inOrder,
  };
}
