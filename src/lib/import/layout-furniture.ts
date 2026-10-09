import { A, D, pipe, S } from "@mobily/ts-belt";
import { isPageNumber, isPortalFurniture, normalize } from "./dictionary";
import { type Line, lineText } from "./layout-lines";
import type { PdfDocument } from "./pdf-items";

/** Why a line was taken out of the content. */
export type FurnitureReason =
  | "page-number"
  | "repeated"
  | "portal"
  | "watermark";

export interface RemovedLine {
  page: number;
  text: string;
  reason: FurnitureReason;
}

/** Top and bottom share of a page where running headers and footers live. */
const MARGIN = 0.07;

/** The same line on this share of pages (at least two) is page furniture. */
const REPEAT_SHARE = 0.6;

/** Digits vary (page 1, page 2); the rest of a running header does not. */
function fingerprint(line: Line): string {
  return S.replaceByRe(normalize(lineText(line)), /\d+/g, "#");
}

interface Context {
  heights: Record<number, number>;
  pageCount: number;
  repeated: Set<string>;
  medianSize: number;
}

function median(values: ReadonlyArray<number>): number {
  const sorted = A.sort(values, (a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 10;
}

function reasonFor(line: Line, context: Context): FurnitureReason | null {
  const text = lineText(line);
  const height = context.heights[line.page] ?? 842;
  const inMargin =
    line.top < height * MARGIN || line.top > height * (1 - MARGIN);
  if (inMargin && isPageNumber(text)) return "page-number";
  if (isPortalFurniture(text)) return "portal";
  // A footer line often carries the portal and the page number together:
  // "Created with cvbankas.lt    1/2".
  if (
    inMargin &&
    A.some(
      line.cells,
      (cell) => isPortalFurniture(cell.text) || isPageNumber(cell.text),
    )
  ) {
    return A.some(line.cells, (cell) => isPortalFurniture(cell.text))
      ? "portal"
      : "page-number";
  }
  if (!context.repeated.has(fingerprint(line))) return null;
  return line.size > context.medianSize * 2.5 ? "watermark" : "repeated";
}

/**
 * Separates the content from page furniture: page numbers, running headers
 * and footers repeated on several pages, portal branding and "created with"
 * footers (from the extensible portal list), and watermarks. Rotated text is
 * dropped earlier, at extraction. The removed lines are kept for the review
 * screen, so nothing disappears silently.
 */
export function removeFurniture(
  doc: PdfDocument,
  lines: ReadonlyArray<Line>,
): { lines: ReadonlyArray<Line>; removed: ReadonlyArray<RemovedLine> } {
  const pageCount = A.length(doc.pages);
  const heights = D.fromPairs(
    A.map(doc.pages, (page) => [String(page.number), page.height] as const),
  ) as unknown as Record<number, number>;
  // A line counts as running furniture when it recurs on most pages at the
  // same height (a header, a logo line) or always inside the margins. Content
  // that merely repeats ("Speaking: Fluent" for two languages) moves around.
  const repeated = new Set(
    pipe(
      lines,
      A.groupBy(fingerprint),
      D.toPairs,
      A.filter(([key, group]) => {
        const occurrences = group ?? [];
        const pages = A.length(A.uniq(A.map(occurrences, (line) => line.page)));
        const tops = A.map(occurrences, (line) => line.top);
        const spread = Math.max(...tops) - Math.min(...tops);
        const inMargins = A.every(occurrences, (line) => {
          const height = heights[line.page] ?? 842;
          return line.top < height * MARGIN || line.top > height * (1 - MARGIN);
        });
        // Phone numbers fingerprint alike ("+#"); without letters a line
        // is only furniture inside the margins.
        const letters = S.length(S.replaceByRe(key, /[^\p{L}]/gu, ""));
        return (
          pageCount >= 2 &&
          pages >= 2 &&
          pages >= pageCount * REPEAT_SHARE &&
          S.length(key) > 1 &&
          (inMargins || (spread <= 12 && letters >= 3))
        );
      }),
      A.map(([key]) => key),
    ),
  );
  const context: Context = {
    heights,
    pageCount,
    repeated,
    medianSize: median(A.map(lines, (line) => line.size)),
  };
  const rotated = A.flatMap(doc.pages, (page) =>
    pipe(
      page.items,
      A.filter((item) => item.rotated),
      A.map(
        (item): RemovedLine => ({
          page: page.number,
          text: S.trim(item.text),
          reason: "watermark",
        }),
      ),
    ),
  );
  const verdicts = A.map(lines, (line) => ({
    line,
    reason: reasonFor(line, context),
  }));
  return {
    lines: A.filterMap(verdicts, (verdict) =>
      verdict.reason === null ? verdict.line : undefined,
    ),
    removed: A.concat(
      rotated,
      A.filterMap(verdicts, (verdict) =>
        verdict.reason === null
          ? undefined
          : {
              page: verdict.line.page,
              text: lineText(verdict.line),
              reason: verdict.reason,
            },
      ),
    ),
  };
}
