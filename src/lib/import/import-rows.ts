import { A, pipe, S } from "@mobily/ts-belt";
import type { JSONContent } from "@tiptap/core";
import type { Row } from "./layout-columns";
import type { Cell } from "./layout-lines";

/**
 * A row as the section parsers read it: an optional label (the narrow
 * column's text) and the content beside it, with the typography that tells a
 * job title from its description.
 */
export interface TextRow {
  page: number;
  top: number;
  size: number;
  bold: boolean;
  label: string;
  /** Content cells left to right: "Senior Engineer" … "2019 – 2021". */
  cells: ReadonlyArray<string>;
  /** All content cells joined. */
  text: string;
}

function join(cells: ReadonlyArray<Cell>): string {
  return pipe(
    cells,
    A.map((cell) => cell.text),
    A.join(" "),
    S.replaceByRe(/\s+/g, " "),
    S.trim,
  );
}

export function toTextRow(row: Row): TextRow {
  const content = A.concat(row.full, row.right);
  const all = A.concat(row.left, content);
  return {
    page: row.page,
    top: row.top,
    size: row.size,
    bold: A.isNotEmpty(content)
      ? A.every(content, (cell) => cell.bold)
      : A.every(all, (cell) => cell.bold),
    label: join(row.left),
    cells: A.map(content, (cell) => S.trim(cell.text)),
    text: join(content),
  };
}

/** The row's whole visible text, label first. */
export function rowText(row: TextRow): string {
  return S.trim(`${row.label} ${row.text}`);
}

export const BULLET = /^\s*(?:[•●▪■◦○·‣⁃∙*]|[-–—](?=\s))\s*/u;

export function isBullet(text: string): boolean {
  return BULLET.test(text);
}

function stripBullet(text: string): string {
  return S.trim(S.replaceByRe(text, BULLET, ""));
}

function wordCount(text: string): number {
  return A.length(A.reject(S.split(S.trim(text), " "), S.isEmpty));
}

/** A short line that does not end a sentence: a title, not description. */
export function isHeaderLike(row: TextRow, bodySize: number): boolean {
  if (isBullet(row.text)) return false;
  if (row.bold || row.size > bodySize * 1.08) return wordCount(row.text) <= 14;
  return wordCount(row.text) <= 8 && !/[.!?;:]$/.test(row.text);
}

interface Block {
  kind: "paragraph" | "bullet";
  text: string;
}

/**
 * Lines back into paragraphs and bullet items. A PDF breaks every visual
 * line; a line continues the previous one unless it starts a bullet, the
 * previous line ended a sentence, or a gap above it opens a new paragraph.
 */
function toBlocks(rows: ReadonlyArray<TextRow>): ReadonlyArray<Block> {
  const lineGap = (row: TextRow) => row.size * 1.75;
  return A.reduce(
    A.mapWithIndex(rows, (index, row) => ({ row, previous: rows[index - 1] })),
    [] as ReadonlyArray<Block>,
    (blocks, { row, previous }) => {
      const text = row.text;
      if (S.isEmpty(text)) return blocks;
      const last = blocks[blocks.length - 1];
      if (isBullet(text)) {
        return A.append(blocks, { kind: "bullet", text: stripBullet(text) });
      }
      const gap = previous ? row.top - previous.top : 0;
      const continues =
        last !== undefined &&
        previous !== undefined &&
        previous.page === row.page &&
        gap <= lineGap(row) &&
        (!/[.!?:]$/.test(last.text) || /^\p{Ll}/u.test(text));
      if (continues && last) {
        const joined = /[-‐]$/.test(last.text)
          ? `${S.replaceByRe(last.text, /[-‐]$/, "")}${text}`
          : `${last.text} ${text}`;
        return A.replaceAt(blocks, blocks.length - 1, {
          ...last,
          text: joined,
        });
      }
      return A.append(blocks, { kind: "paragraph", text });
    },
  );
}

function textNode(text: string): JSONContent {
  return { type: "text", text };
}

/** Rows as a restricted TipTap document: paragraphs and one bullet list per run. */
export function rowsToRich(rows: ReadonlyArray<TextRow>): JSONContent {
  const blocks = toBlocks(rows);
  const content = A.reduce(
    blocks,
    [] as ReadonlyArray<JSONContent>,
    (nodes, block) => {
      if (block.kind === "paragraph") {
        return A.append(nodes, {
          type: "paragraph",
          content: [textNode(block.text)],
        });
      }
      const item: JSONContent = {
        type: "listItem",
        content: [{ type: "paragraph", content: [textNode(block.text)] }],
      };
      const last = nodes[nodes.length - 1];
      if (last?.type === "bulletList") {
        return A.replaceAt(nodes, nodes.length - 1, {
          ...last,
          content: [...(last.content ?? []), item],
        });
      }
      return A.append(nodes, { type: "bulletList", content: [item] });
    },
  );
  return {
    type: "doc",
    content: A.isEmpty(content) ? [{ type: "paragraph" }] : [...content],
  };
}

/** Rows as one line of plain text. */
export function rowsToPlain(rows: ReadonlyArray<TextRow>): string {
  return pipe(
    toBlocks(rows),
    A.map((block) => block.text),
    A.join(" "),
    S.trim,
  );
}

/**
 * Rows read as running text, the label folded in. A paragraph's short last
 * line can fall left of the column gutter and read as a label; in prose it
 * is still prose.
 */
export function asContent(
  rows: ReadonlyArray<TextRow>,
): ReadonlyArray<TextRow> {
  return A.map(rows, (row) =>
    S.isEmpty(row.label) ? row : { ...row, label: "", text: rowText(row) },
  );
}

/** The median font size: the body text's size. */
export function bodySize(rows: ReadonlyArray<TextRow>): number {
  const sizes = A.sort(
    A.map(rows, (row) => row.size),
    (a, b) => a - b,
  );
  return sizes[Math.floor(sizes.length / 2)] ?? 10;
}
