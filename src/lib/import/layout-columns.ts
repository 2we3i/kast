import { A, D, O, pipe, S } from "@mobily/ts-belt";
import { parseDateRange, withoutDate } from "./dates";
import { headingKind } from "./dictionary";
import type { Cell, Line } from "./layout-lines";
import type { PdfDocument } from "./pdf-items";

/**
 * How a page lays its text out:
 * - "single": one column, read top to bottom;
 * - "labels": a narrow column of labels (dates, language names, field names)
 *   beside the content they describe, read row by row;
 * - "sidebar": two independent columns (a skills sidebar beside the
 *   experience), each read on its own, the wider one first.
 */
export type LayoutKind = "single" | "labels" | "sidebar";

/** One visual line split at the column gutter. */
export interface Row {
  page: number;
  top: number;
  size: number;
  /** Cells left of the gutter: labels, or the sidebar. */
  left: ReadonlyArray<Cell>;
  /** Cells right of the gutter. */
  right: ReadonlyArray<Cell>;
  /** A cell crossing the gutter: a full-width heading or paragraph. */
  full: ReadonlyArray<Cell>;
}

export interface Layout {
  kind: LayoutKind;
  /** Rows in reading order: one stream, or the main stream then the sidebar. */
  streams: ReadonlyArray<ReadonlyArray<Row>>;
}

/** Rounded to this grid, boundaries between cells cluster into a gutter. */
const GUTTER_GRID = 8;

/**
 * The content column's left edge: where cells after the first one on a line
 * most often start. Date-only cells (right-aligned dates in a one-column
 * layout) do not count. Of the recurring starts, the leftmost one that is
 * at least half as common as the most common wins, so a third column of
 * level words ("Gerai", "Puikiai") never beats the content column.
 */
function findGutter(
  lines: ReadonlyArray<Line>,
  pageWidth: number,
): number | null {
  const starts = pipe(
    lines,
    A.filter((line) => A.length(line.cells) >= 2),
    A.flatMap((line) => A.drop(line.cells, 1)),
    A.reject((cell) => isDateOnly(cell.text)),
    A.map((cell) => Math.round(cell.x / GUTTER_GRID) * GUTTER_GRID),
    A.filter((x) => x > pageWidth * 0.15 && x < pageWidth * 0.75),
  );
  const counts = pipe(
    starts,
    A.groupBy((x) => String(x)),
    D.map((group) => A.length(group ?? [])),
    D.toPairs,
    A.map(([x, count]) => ({ x: Number(x), count })),
    A.filter((candidate) => candidate.count >= 3),
  );
  const best = A.reduce(counts, 0, (max, candidate) =>
    Math.max(max, candidate.count),
  );
  return O.match(
    A.head(
      A.sortBy(
        A.filter(counts, (candidate) => candidate.count >= best / 2),
        (candidate) => candidate.x,
      ),
    ),
    (candidate) => candidate.x - GUTTER_GRID / 2,
    () => null,
  );
}

function isDateOnly(text: string): boolean {
  const range = parseDateRange(text);
  return (
    range !== null && S.length(S.trim(withoutDate(text, range.matched))) < 3
  );
}

function splitRow(line: Line, gutter: number): Row {
  const left = A.filter(line.cells, (cell) => cell.right <= gutter + 2);
  const right = A.filter(line.cells, (cell) => cell.x >= gutter - 2);
  const full = A.filter(
    line.cells,
    (cell) => cell.right > gutter + 2 && cell.x < gutter - 2,
  );
  return { page: line.page, top: line.top, size: line.size, left, right, full };
}

function wholeRow(line: Line): Row {
  return {
    page: line.page,
    top: line.top,
    size: line.size,
    left: [],
    right: [],
    full: line.cells,
  };
}

function cellsText(cells: ReadonlyArray<Cell>): string {
  return A.join(
    A.map(cells, (cell) => cell.text),
    " ",
  );
}

/**
 * A sidebar holds its own headings and runs on lines of its own; a label
 * column mostly sits on the same lines as the content it labels.
 */
/** Share of values within `tolerance` of the most common one. */
function alignment(values: ReadonlyArray<number>, tolerance: number): number {
  if (A.isEmpty(values)) return 0;
  const best = A.reduce(values, 0, (max, value) =>
    Math.max(
      max,
      A.length(
        A.filter(values, (other) => Math.abs(other - value) <= tolerance),
      ),
    ),
  );
  return best / A.length(values);
}

/**
 * Labels sit on the same lines as the content they describe, and portals
 * usually right-align them against the gutter. A sidebar is a column of its
 * own: left-aligned, with its own headings, and its lines only meet the
 * main column's by chance.
 */
function classify(rows: ReadonlyArray<Row>): LayoutKind {
  const withLeft = A.filter(rows, (row) => A.isNotEmpty(row.left));
  if (A.length(withLeft) < 3) return "single";
  const paired = A.filter(withLeft, (row) => A.isNotEmpty(row.right));
  const ratio = A.length(paired) / A.length(withLeft);
  const labelCells = A.flatMap(paired, (row) => row.left);
  const rightAligned =
    alignment(
      A.map(labelCells, (cell) => cell.right),
      3,
    ) >= 0.6;
  const leftHeadings = A.filter(
    withLeft,
    (row) => A.isEmpty(row.right) && headingKind(cellsText(row.left)) !== null,
  );
  if (rightAligned && ratio >= 0.25) return "labels";
  if (ratio >= 0.6) return "labels";
  if (A.length(leftHeadings) >= 1) return "sidebar";
  return ratio >= 0.25 ? "labels" : "single";
}

function textLength(rows: ReadonlyArray<Row>, side: "left" | "right"): number {
  return A.reduce(rows, 0, (sum, row) => sum + S.length(cellsText(row[side])));
}

/** A row holding only one side's cells, the other side's moved out. */
function onlySide(row: Row, side: "left" | "right"): Row {
  return {
    ...row,
    left: [],
    right: [],
    full:
      side === "left"
        ? A.concat(row.full, row.left)
        : A.concat(row.full, row.right),
  };
}

/**
 * Splits lines at the column gutter and decides the reading order. Each page
 * is measured on its own (a cover page may differ), but the layout kind is
 * decided once for the document.
 */
export function buildLayout(
  doc: PdfDocument,
  lines: ReadonlyArray<Line>,
): Layout {
  const rows = A.flatMap(doc.pages, (page) => {
    const pageLines = A.filter(lines, (line) => line.page === page.number);
    const gutter = findGutter(pageLines, page.width);
    return gutter === null
      ? A.map(pageLines, wholeRow)
      : A.map(pageLines, (line) => splitRow(line, gutter));
  });
  const kind = classify(rows);
  if (kind === "single") {
    return {
      kind,
      streams: [
        A.map(rows, (row) => ({
          ...row,
          left: [],
          right: [],
          full: A.concat(A.concat(row.left, row.full), row.right),
        })),
      ],
    };
  }
  if (kind === "labels") return { kind, streams: [rows] };
  // Sidebar: the wider stream is the main text and is read first; full-width
  // rows (the name, a page title) stay with it.
  const mainSide =
    textLength(rows, "right") >= textLength(rows, "left") ? "right" : "left";
  const sideSide = mainSide === "right" ? "left" : "right";
  const main = pipe(
    rows,
    A.filter((row) => A.isNotEmpty(row[mainSide]) || A.isNotEmpty(row.full)),
    A.map((row) => onlySide(row, mainSide)),
  );
  const sidebar = pipe(
    rows,
    A.filter((row) => A.isNotEmpty(row[sideSide])),
    A.map((row) => ({ ...onlySide(row, sideSide), full: row[sideSide] })),
  );
  return { kind, streams: [main, sidebar] };
}
