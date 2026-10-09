import { A, D, O, pipe, S } from "@mobily/ts-belt";
import { RESUME_LABELS } from "@/lib/resume/labels";
import {
  type LanguageSkill,
  languageLevel,
  languageSkill,
  normalize,
} from "./dictionary";

/**
 * Helpers for skills and languages laid out as a grid: two or more items on
 * one line, each "Name Level", the way Kast's own templates and many
 * builders print them.
 */

/** Every proficiency word the document labels use, back to its stored key. */
const STORED_LEVELS = new Map<string, string>(
  pipe(
    D.values(RESUME_LABELS),
    A.flatMap((labels) => D.toPairs(labels.levels)),
    A.flatMap(([key, word]) => [
      [normalize(word), key] as const,
      [normalize(key), key] as const,
    ]),
  ),
);

/** "Ekspertas" → "Expert"; null when the text is no known level word. */
export function storedLevel(text: string): string | null {
  return STORED_LEVELS.get(normalize(text)) ?? null;
}

export interface NameLevel {
  name: string;
  level: string;
}

/**
 * "TypeScript Expert" → { TypeScript, Expert }, trying the last one to three
 * words as a level, so "Pokalbio lygiu" is found whole. A cell with no level
 * word is all name.
 */
export function splitTrailingLevel(text: string): NameLevel {
  const words = S.split(S.trim(text), " ");
  const found = pipe(
    [3, 2, 1],
    A.filter((count) => A.length(words) > count),
    A.filterMap((count) => {
      const tail = A.join(A.sliceToEnd(words, A.length(words) - count), " ");
      const level = storedLevel(tail);
      if (level === null) return O.None;
      return O.Some({
        name: A.join(A.take(words, A.length(words) - count), " "),
        level,
      });
    }),
    A.head,
  );
  return O.getWithDefault(found, { name: S.trim(text), level: "" });
}

/** Whether a whole cell is just a level word ("Expert", "Gimtoji"). */
export function isLevelCell(text: string): boolean {
  return storedLevel(text) !== null;
}

/**
 * Splits a grid row's cells into items: a level-only cell belongs to the
 * name before it, and any other cell starts a new item.
 */
export function gridItems(
  cells: ReadonlyArray<string>,
): ReadonlyArray<NameLevel> {
  return A.reduce(cells, [] as ReadonlyArray<NameLevel>, (items, cell) => {
    const last = A.last(items);
    if (isLevelCell(cell) && O.isSome(last) && S.isEmpty(last.level)) {
      return A.replaceAt(items, A.length(items) - 1, {
        ...last,
        level: storedLevel(cell) ?? cell,
      });
    }
    return A.append(items, splitTrailingLevel(cell));
  });
}

export type SkillLevels = Partial<Record<LanguageSkill, string>>;

export interface GridSkill extends NameLevel {
  description: string;
}

interface SkillState {
  items: ReadonlyArray<GridSkill>;
  /** Indexes of the items the previous grid row started. */
  previous: ReadonlyArray<number>;
}

/**
 * Skills from grid rows. A row of two or more cells holds items; a
 * one-cell row right after one holds the description of the item above it.
 */
export function gridSkills(
  rows: ReadonlyArray<{ cells: ReadonlyArray<string>; text: string }>,
): ReadonlyArray<GridSkill> {
  const final = A.reduce(
    rows,
    { items: [], previous: [] } as SkillState,
    (state, row) => {
      const cells = A.length(row.cells) >= 2 ? row.cells : [row.text];
      const rowItems = gridItems(cells);
      const describes =
        A.length(cells) === 1 &&
        A.isNotEmpty(state.previous) &&
        S.isEmpty(A.getUnsafe(rowItems, 0).level);
      if (describes) {
        const target = A.getUnsafe(state.previous, 0);
        const item = A.getUnsafe(state.items, target);
        const description = S.trim(`${item.description} ${row.text}`);
        return {
          items: A.replaceAt(state.items, target, { ...item, description }),
          previous: [],
        };
      }
      const start = A.length(state.items);
      return {
        items: A.concat(
          state.items,
          A.map(rowItems, (item) => ({ ...item, description: "" })),
        ),
        previous: A.makeWithIndex(A.length(rowItems), (index) => start + index),
      };
    },
  );
  return A.reject(final.items, (item) => S.isEmpty(item.name));
}

/** A language as a grid gives it: name, level, and the three skills. */
export interface GridLanguage extends NameLevel {
  skills: SkillLevels;
}

interface LanguageState {
  items: ReadonlyArray<GridLanguage>;
  previous: ReadonlyArray<number>;
  /** A skill whose level wrapped onto the next line. */
  pending: { index: number; skill: LanguageSkill } | null;
}

function startsWithSkill(text: string): boolean {
  const [first = ""] = S.split(S.trim(text), " ");
  return languageSkill(first) !== null;
}

/** "Kalbėjimas C1 · Supratimas" → its pairs, the last one maybe levelless. */
function partialTriple(
  text: string,
): ReadonlyArray<readonly [LanguageSkill, string]> {
  return pipe(
    S.splitByRe(text, /\s*[·|;]\s*/),
    A.map((part) => S.trim(part ?? "")),
    A.reject(S.isEmpty),
    A.filterMap((part) => {
      const [first = "", ...rest] = S.split(part, " ");
      const skill = languageSkill(first);
      if (skill === null) return O.None;
      const raw = S.trim(A.join(rest, " "));
      return O.Some([skill, languageLevel(raw) ?? raw] as const);
    }),
  );
}

/**
 * Languages from grid rows: "Lietuvių Gimtoji  Anglų Laisvai" starts two
 * languages; a following "Kalbėjimas … · Supratimas … · Rašymas …" row gives
 * their skills, cell by cell, even when a level wraps onto its own line.
 */
export function gridLanguages(
  rows: ReadonlyArray<{ cells: ReadonlyArray<string>; text: string }>,
): ReadonlyArray<GridLanguage> {
  const final = A.reduce(
    rows,
    { items: [], previous: [], pending: null } as LanguageState,
    (state, row) => {
      const cells = A.length(row.cells) >= 2 ? row.cells : [row.text];
      if (A.every(cells, startsWithSkill) && A.isNotEmpty(state.previous)) {
        return A.reduce(
          A.mapWithIndex(cells, (index, cell) => ({ index, cell })),
          { ...state, pending: null } as LanguageState,
          (current, { index, cell }) => {
            const target = O.getWithDefault(
              A.get(current.previous, index),
              A.getUnsafe(current.previous, 0),
            );
            const pairs = partialTriple(cell);
            const item = A.getUnsafe(current.items, target);
            const skills = A.reduce(
              pairs,
              item.skills,
              (acc, [skill, level]) =>
                S.isEmpty(level) ? acc : D.set(acc, skill, level),
            );
            const last = A.last(pairs);
            const pending = O.match(
              last,
              ([skill, level]) =>
                S.isEmpty(level) ? { index: target, skill } : null,
              () => null,
            );
            return {
              ...current,
              items: A.replaceAt(current.items, target, { ...item, skills }),
              // A wrapped level always belongs to the first cell's last skill.
              pending: current.pending ?? pending,
            };
          },
        );
      }
      const wrapped = state.pending;
      const lone = languageLevel(row.text);
      if (wrapped && A.length(cells) === 1 && lone !== null) {
        const item = A.getUnsafe(state.items, wrapped.index);
        return {
          ...state,
          items: A.replaceAt(state.items, wrapped.index, {
            ...item,
            skills: D.set(item.skills, wrapped.skill, lone),
          }),
          pending: null,
        };
      }
      const rowItems = A.map(gridItems(cells), (item) => ({
        ...item,
        skills: {} as SkillLevels,
      }));
      const start = A.length(state.items);
      return {
        items: A.concat(state.items, rowItems),
        previous: A.makeWithIndex(A.length(rowItems), (index) => start + index),
        pending: null,
      };
    },
  );
  return A.reject(final.items, (item) => S.isEmpty(item.name));
}
