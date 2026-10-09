import { A, pipe, S } from "@mobily/ts-belt";
import type { PdfDocument, PdfItem } from "./pdf-items";

/** A run of text on one line, set in one size, with no wide gap inside. */
export interface Cell {
  x: number;
  right: number;
  text: string;
  size: number;
  bold: boolean;
}

/** Everything on one visual line of one page, left to right. */
export interface Line {
  page: number;
  top: number;
  /** The largest font size on the line. */
  size: number;
  cells: ReadonlyArray<Cell>;
}

export function lineText(line: Pick<Line, "cells">): string {
  return pipe(
    line.cells,
    A.map((cell) => cell.text),
    A.join(" "),
    S.replaceByRe(/\s+/g, " "),
    S.trim,
  );
}

/** Items share a line when their baselines sit within this share of the size. */
const SAME_LINE = 0.6;

function groupLines(
  items: ReadonlyArray<PdfItem>,
): ReadonlyArray<ReadonlyArray<PdfItem>> {
  const sorted = A.sort(items, (a, b) =>
    a.page !== b.page ? a.page - b.page : a.top - b.top || a.x - b.x,
  );
  return A.reduce(
    sorted,
    [] as ReadonlyArray<ReadonlyArray<PdfItem>>,
    (lines, item) => {
      const last = lines[lines.length - 1];
      const anchor = last?.[0];
      if (
        last &&
        anchor &&
        anchor.page === item.page &&
        Math.abs(anchor.top - item.top) <=
          SAME_LINE * Math.max(anchor.size, item.size)
      ) {
        return A.replaceAt(lines, lines.length - 1, A.append(last, item));
      }
      return A.append(lines, [item]);
    },
  );
}

/**
 * Splits a line into cells: a new cell starts after a gap wider than about a
 * character, or where the font size changes (a name set larger than the city
 * beside it).
 */
function toCells(items: ReadonlyArray<PdfItem>): ReadonlyArray<Cell> {
  const sorted = A.sort(items, (a, b) => a.x - b.x);
  return A.reduce(sorted, [] as ReadonlyArray<Cell>, (cells, item) => {
    const last = cells[cells.length - 1];
    const right = item.x + item.width;
    if (!last) {
      return [
        { x: item.x, right, text: item.text, size: item.size, bold: item.bold },
      ];
    }
    const gap = item.x - last.right;
    const sizeChange =
      Math.abs(item.size - last.size) / Math.max(item.size, last.size) > 0.2;
    if (gap > Math.max(item.size * 1.2, 6) || sizeChange) {
      return A.append(cells, {
        x: item.x,
        right,
        text: item.text,
        size: item.size,
        bold: item.bold,
      });
    }
    const joiner =
      gap > item.size * 0.15 && !/\s$/.test(last.text) && !/^\s/.test(item.text)
        ? " "
        : "";
    return A.replaceAt(cells, cells.length - 1, {
      x: last.x,
      right: Math.max(last.right, right),
      text: last.text + joiner + item.text,
      size: Math.max(last.size, item.size),
      bold: last.bold && item.bold,
    });
  });
}

/** The document as visual lines, top to bottom, page by page. */
export function buildLines(doc: PdfDocument): ReadonlyArray<Line> {
  const items = A.flatMap(doc.pages, (page) =>
    A.reject(page.items, (item) => item.rotated),
  );
  return pipe(
    groupLines(items),
    A.map((group) => {
      const cells = A.map(toCells(group), (cell) => ({
        ...cell,
        text: S.trim(S.replaceByRe(cell.text, /\s+/g, " ")),
      }));
      return {
        page: group[0]?.page ?? 1,
        top:
          A.reduce(group, 0, (sum, item) => sum + item.top) /
          Math.max(1, group.length),
        size: A.reduce(cells, 0, (max, cell) => Math.max(max, cell.size)),
        cells: A.reject(cells, (cell) => S.isEmpty(cell.text)),
      };
    }),
    A.reject((line) => A.isEmpty(line.cells)),
  );
}
