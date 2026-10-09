import { A, pipe } from "@mobily/ts-belt";

export interface DiffPart {
  text: string;
  kind: "same" | "added" | "removed";
}

function tokens(text: string): ReadonlyArray<string> {
  return text.match(/\s+|[^\s]+/g) ?? [];
}

/**
 * A word-level diff of two texts (longest common subsequence), for the
 * before/after view of an AI suggestion. Fields are short, so the quadratic
 * table is cheap.
 */
export function diffWords(
  before: string,
  after: string,
): ReadonlyArray<DiffPart> {
  const a = tokens(before);
  const b = tokens(after);
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = new Uint32Array(rows * cols);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i * cols + j] =
        a[i] === b[j]
          ? table[(i + 1) * cols + j + 1] + 1
          : Math.max(table[(i + 1) * cols + j], table[i * cols + j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      parts.push({ text: a[i] ?? "", kind: "same" });
      i += 1;
      j += 1;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + j + 1]) {
      parts.push({ text: a[i] ?? "", kind: "removed" });
      i += 1;
    } else {
      parts.push({ text: b[j] ?? "", kind: "added" });
      j += 1;
    }
  }
  for (; i < a.length; i += 1)
    parts.push({ text: a[i] ?? "", kind: "removed" });
  for (; j < b.length; j += 1) parts.push({ text: b[j] ?? "", kind: "added" });
  return mergeRuns(parts);
}

/** Joins neighbouring parts of the same kind into one. */
function mergeRuns(parts: ReadonlyArray<DiffPart>): ReadonlyArray<DiffPart> {
  return pipe(
    parts,
    A.reduce([] as ReadonlyArray<DiffPart>, (acc, part) => {
      const last = acc[acc.length - 1];
      if (last && last.kind === part.kind) {
        return A.replaceAt(acc, acc.length - 1, {
          kind: last.kind,
          text: last.text + part.text,
        });
      }
      return A.append(acc, part);
    }),
  );
}
