import { A, D, O, pipe, S } from "@mobily/ts-belt";
import { createEmptyEntry } from "@/lib/resume/factory";
import type { Entry, Field } from "@/lib/resume/types";
import {
  type CefrLevel,
  languageLevel,
  languageSkill,
  levelBadge,
} from "./dictionary";
import { type ImportMetadata, type Parsed, parsed } from "./import-draft";
import { asContent, rowsToPlain, type TextRow } from "./import-rows";
import { gridLanguages, gridSkills } from "./parse-grid";

function plain(value: string): Field {
  return { kind: "plain", value: S.trim(value) };
}

function withFields(entry: Entry, values: Record<string, string>): Entry {
  return {
    ...entry,
    fields: A.reduce(D.toPairs(values), entry.fields, (fields, [key, value]) =>
      D.set(fields, key, plain(value)),
    ),
  };
}

/**
 * Splits rows into label-led groups: a row with a label starts a group, and
 * a label that runs onto a second line ("C++ | Python |" / "JavaScript")
 * stays in the same group when the line above also had a label.
 */
function labelGroups(
  rows: ReadonlyArray<TextRow>,
): ReadonlyArray<{ label: string; rows: ReadonlyArray<TextRow> }> {
  return A.reduce(
    A.mapWithIndex(rows, (index, row) => ({ row, previous: rows[index - 1] })),
    [] as ReadonlyArray<{ label: string; rows: ReadonlyArray<TextRow> }>,
    (groups, { row, previous }) => {
      const last = groups[groups.length - 1];
      const continuesLabel =
        last !== undefined &&
        previous !== undefined &&
        S.isNotEmpty(previous.label) &&
        S.isNotEmpty(row.label) &&
        row.top - previous.top <= row.size * 1.6 &&
        (S.isEmpty(row.text) ||
          S.isEmpty(previous.text) ||
          /[|,/]$/.test(previous.label));
      if (S.isNotEmpty(row.label) && !continuesLabel) {
        return A.append(groups, {
          label: row.label,
          rows: S.isEmpty(row.text) ? [] : [{ ...row, label: "" }],
        });
      }
      if (!last) return A.append(groups, { label: "", rows: [row] });
      return A.replaceAt(groups, groups.length - 1, {
        label: S.isNotEmpty(row.label)
          ? `${last.label} ${row.label}`
          : last.label,
        rows: S.isEmpty(row.text)
          ? last.rows
          : A.append(last.rows, { ...row, label: "" }),
      });
    },
  );
}

/** "C++ | Python |" → "C++, Python". */
function cleanList(text: string): string {
  return pipe(
    S.splitByRe(text, /\s*[|,;·•]\s*/),
    A.map((part) => S.trim(part ?? "")),
    A.reject(S.isEmpty),
    A.join(", "),
  );
}

const ITEM_SPLIT = /\s*(?:[,;·•|]|\s{2,})\s*/;
const NAME_LEVEL = /^(.+?)\s*(?:[-–—:]\s*|\((?=[^)]*\)$))(.+?)\)?$/u;

/**
 * Skills: in a label layout each label is a skill (or a group of skills) with
 * an optional "Level …" badge and a description; in one column, lines list
 * skills separated by commas, bars, or bullets, optionally "Skill — Level".
 */
export function parseSkills(
  rows: ReadonlyArray<TextRow>,
  labelled: boolean,
): Parsed<ReadonlyArray<Entry>> {
  if (labelled && A.some(rows, (row) => S.isNotEmpty(row.label))) {
    const groups = labelGroups(rows);
    const results = A.map(groups, (group) => {
      const badge = O.toUndefined(
        A.find(
          A.map(group.rows, (row) => levelBadge(row.text)),
          (value) => value !== null,
        ),
      );
      const description = A.reject(
        group.rows,
        (row) => levelBadge(row.text) !== null,
      );
      const name = group.label
        ? cleanList(group.label)
        : rowsToPlain(A.take(description, 1));
      const entry = withFields(createEmptyEntry("skills"), {
        name,
        level: badge ?? "",
        description: group.label ? rowsToPlain(description) : "",
      });
      return {
        entry,
        confidence: {
          [`${entry.id}/name`]: group.label ? 0.85 : 0.5,
          ...(badge ? { [`${entry.id}/level`]: 0.8 } : {}),
          ...(A.isNotEmpty(description)
            ? { [`${entry.id}/description`]: 0.7 }
            : {}),
        },
        metadata: badge ? [{ kind: "level" as const, text: badge }] : [],
      };
    });
    return {
      value: A.map(results, (result) => result.entry),
      confidence: A.reduce(results, {}, (acc, result) => ({
        ...acc,
        ...result.confidence,
      })),
      metadata: A.flatMap(results, (result) => result.metadata),
      leftovers: [],
    };
  }
  if (A.some(rows, (row) => A.length(row.cells) >= 2)) {
    const entries = A.map(gridSkills(rows), (item) =>
      withFields(createEmptyEntry("skills"), {
        name: item.name,
        level: item.level,
        description: item.description,
      }),
    );
    return parsed(entries, {
      confidence: D.fromPairs(
        A.flatMap(entries, (entry) => [
          [`${entry.id}/name`, 0.8] as const,
          [`${entry.id}/level`, 0.75] as const,
        ]),
      ),
    });
  }
  // With "Skill — Level" pairs, a bar belongs to the name ("SAP | Navision");
  // only commas and semicolons separate skills then.
  const joined = rowsToPlain(asContent(rows));
  const split = /\s[-–—:]\s/.test(joined) ? /\s*[,;]\s*/ : ITEM_SPLIT;
  // One "Skill — Level" per line (a sidebar list) splits at the lines too.
  const lines = A.map(asContent(rows), (row) => S.trim(row.text));
  const perLine =
    A.length(lines) >= 2 &&
    A.length(A.filter(lines, (line) => /\s[-–—:]\s/.test(line))) >=
      A.length(lines) * 0.6;
  const items = pipe(
    perLine ? lines : [joined],
    A.flatMap((text) => S.splitByRe(text, split)),
    A.map((item) => S.trim(item ?? "")),
    A.reject((item) => S.isEmpty(item) || S.length(item) > 80),
  );
  const entries = A.map(items, (item) => {
    const match = NAME_LEVEL.exec(item);
    const name = match ? S.trim(match[1] ?? "") : item;
    const level = match ? S.trim(match[2] ?? "") : "";
    return withFields(createEmptyEntry("skills"), {
      name,
      level,
      description: "",
    });
  });
  return parsed(entries, {
    confidence: D.fromPairs(
      A.map(entries, (entry) => [`${entry.id}/name`, 0.75] as const),
    ),
  });
}

/** The descriptive word stored for a set of CEFR skill levels. */
function overallLevel(levels: ReadonlyArray<CefrLevel>): string {
  if (A.includes(levels, "native")) return "Native";
  const order: ReadonlyArray<CefrLevel> = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const best = A.reduce(levels, -1, (max, level) =>
    Math.max(
      max,
      O.getWithDefault(
        A.getIndexBy(order, (item) => item === level),
        -1,
      ),
    ),
  );
  return (
    ["Basic", "Basic", "Conversational", "Professional", "Fluent", "Fluent"][
      best
    ] ?? ""
  );
}

interface LanguageDraft {
  name: string;
  level: string;
  skills: Partial<Record<"speaking" | "understanding" | "writing", string>>;
  mapped: boolean;
}

function readSkillRow(text: string, cells: ReadonlyArray<string>) {
  const [first = "", ...rest] =
    A.length(cells) >= 2 ? cells : S.split(text, " ");
  const skill = languageSkill(first);
  if (!skill) return null;
  const raw = S.trim(A.join(rest, " "));
  return { skill, raw, level: languageLevel(raw) };
}

/**
 * Languages: a label layout gives the language as the label and one row per
 * skill ("Kalbėjimas  Vidutiniškai"); one column gives "English — C1" or
 * "Lithuanian (native)". Level words in all three languages map to CEFR; the
 * mapping is approximate, so it is flagged for review.
 */
export function parseLanguages(
  rows: ReadonlyArray<TextRow>,
  labelled: boolean,
): Parsed<ReadonlyArray<Entry>> {
  const drafts: ReadonlyArray<LanguageDraft> =
    labelled && A.some(rows, (row) => S.isNotEmpty(row.label))
      ? A.map(labelGroups(rows), (group) => {
          const skillRows = A.filterMap(
            group.rows,
            (row) => readSkillRow(row.text, row.cells) ?? undefined,
          );
          const skills = D.fromPairs(
            A.map(
              skillRows,
              (item) => [item.skill, item.level ?? item.raw] as const,
            ),
          );
          const levels = A.filterMap(
            skillRows,
            (item) => item.level ?? undefined,
          );
          const plainLevel = A.isEmpty(skillRows)
            ? rowsToPlain(group.rows)
            : "";
          return {
            name: group.label,
            level: plainLevel || overallLevel(levels),
            skills,
            mapped: A.length(levels) === A.length(skillRows),
          };
        })
      : A.some(rows, (row) => A.length(row.cells) >= 2)
        ? A.map(gridLanguages(rows), (item) => ({
            name: item.name,
            level: item.level,
            skills: item.skills,
            mapped: true,
          }))
        : A.filterMap(rows, (row) => {
            const text = S.trim(`${row.label} ${row.text}`);
            if (S.isEmpty(text)) return undefined;
            const match = NAME_LEVEL.exec(text);
            const name = match ? S.trim(match[1] ?? "") : text;
            const raw = match ? S.trim(match[2] ?? "") : "";
            const level = languageLevel(raw);
            return {
              name,
              level: level ? (level === "native" ? "Native" : level) : raw,
              skills: {},
              mapped: level !== null || S.isEmpty(raw),
            };
          });
  const entries = A.map(drafts, (draft) =>
    withFields(createEmptyEntry("languages"), {
      name: draft.name,
      level: draft.level,
      speaking: draft.skills.speaking ?? "",
      understanding: draft.skills.understanding ?? "",
      writing: draft.skills.writing ?? "",
    }),
  );
  const confidence = A.reduce(
    A.zip(entries, drafts),
    {} as Record<string, number>,
    (acc, [entry, draft]) => ({
      ...acc,
      [`${entry.id}/name`]: 0.85,
      [`${entry.id}/level`]: draft.mapped ? 0.75 : 0.45,
      ...(D.isNotEmpty(draft.skills)
        ? {
            [`${entry.id}/speaking`]: draft.mapped ? 0.7 : 0.4,
            [`${entry.id}/understanding`]: draft.mapped ? 0.7 : 0.4,
            [`${entry.id}/writing`]: draft.mapped ? 0.7 : 0.4,
          }
        : {}),
    }),
  );
  return parsed(entries, { confidence });
}

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/u;
const PHONE = /\+?\d[\d\s()-]{6,}\d/;

/** "Jonas Jonaitis": two or three capitalized words that are no job title. */
const JOB_WORDS =
  /direct|manag|engineer|lead|head|chief|officer|owner|founder|specialist|consultant|analyst|developer|designer|ceo|cto|cfo|coo|vadov|direktor|inžinier|savinink|vedėj|директор|менеджер|руководител|инженер|специалист|начальник|владел|основател/i;

function looksLikeName(text: string): boolean {
  const trimmed = S.trim(text);
  return (
    /^\p{Lu}[\p{L}'-]+(\s+\p{Lu}[\p{L}'-]+){1,2}$/u.test(trimmed) &&
    !JOB_WORDS.test(trimmed)
  );
}

/**
 * References: name, position, company, phone, email. A label layout puts the
 * company in the label and "Position | Name (role they knew you in)" beside
 * it; one column lists the same on consecutive lines.
 */
export function parseReferences(
  rows: ReadonlyArray<TextRow>,
  labelled: boolean,
): Parsed<ReadonlyArray<Entry>> {
  const groups =
    labelled && A.some(rows, (row) => S.isNotEmpty(row.label))
      ? labelGroups(rows)
      : A.reduce(
          rows,
          [] as ReadonlyArray<{ label: string; rows: ReadonlyArray<TextRow> }>,
          (acc, row) => {
            const last = acc[acc.length - 1];
            const starts =
              !last ||
              (row.bold && !EMAIL.test(row.text) && !PHONE.test(row.text));
            if (starts) return A.append(acc, { label: "", rows: [row] });
            return A.replaceAt(acc, acc.length - 1, {
              ...last,
              rows: A.append(last.rows, row),
            });
          },
        );
  const metadata: ReadonlyArray<ImportMetadata> = [];
  const results = A.map(groups, (group) => {
    const texts = A.map(group.rows, (row) =>
      S.trim(S.replaceByRe(row.text, /\(.*$/, "")),
    );
    const email = O.mapWithDefault(
      A.find(
        A.map(texts, (t) => EMAIL.exec(t)?.[0] ?? ""),
        S.isNotEmpty,
      ),
      "",
      (v) => v,
    );
    const phone = O.mapWithDefault(
      A.find(
        A.map(texts, (t) => PHONE.exec(t)?.[0] ?? ""),
        S.isNotEmpty,
      ),
      "",
      (v) => v,
    );
    const words = pipe(
      texts,
      A.reject(
        (text) => EMAIL.test(text) || PHONE.test(text) || S.isEmpty(text),
      ),
      A.flatMap((text) => S.splitByRe(text, /\s*[|,–—]\s*/)),
      A.map((part) => S.trim(part ?? "")),
      A.reject(S.isEmpty),
    );
    const name = O.getWithDefault(
      A.find(words, looksLikeName),
      O.getWithDefault(A.head(words), ""),
    );
    const others = A.reject(words, (word) => word === name);
    const entry = withFields(createEmptyEntry("references"), {
      name,
      position: O.getWithDefault(A.get(others, 0), ""),
      company: group.label || O.getWithDefault(A.get(others, 1), ""),
      email,
      phone: S.trim(phone),
    });
    return {
      entry,
      confidence: {
        [`${entry.id}/name`]: looksLikeName(name) ? 0.8 : 0.45,
        [`${entry.id}/position`]: 0.55,
        [`${entry.id}/company`]: group.label ? 0.8 : 0.5,
        ...(email ? { [`${entry.id}/email`]: 0.95 } : {}),
        ...(phone ? { [`${entry.id}/phone`]: 0.9 } : {}),
      },
    };
  });
  return {
    value: A.map(results, (result) => result.entry),
    confidence: A.reduce(results, {}, (acc, result) => ({
      ...acc,
      ...result.confidence,
    })),
    metadata,
    leftovers: [],
  };
}
