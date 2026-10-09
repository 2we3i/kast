import { readFileSync } from "node:fs";
import path from "node:path";
import { R } from "@mobily/ts-belt";
import { describe, expect, it } from "vitest";
import { resumeToPreview } from "@/components/editor/resume-to-preview";
import { resumeToText } from "@/components/editor/resume-to-text";
import type { Field, Resume } from "@/lib/resume/types";
import type { ImportDraft } from "./import-draft";
import { importPdf } from "./pdf-import";

/**
 * The import acceptance test from the spec: on the fixture set, sections and
 * dates must be recognized in at least 90% of cases, and page furniture
 * (portal footers, running headers, page numbers, watermarks) must never
 * reach the content. Fixtures are fictional; regenerate them with
 * `pnpm fixtures:import`.
 */

const DIR = path.resolve(__dirname, "../../../tests/fixtures/import");

interface Expected {
  name: string;
  language: "en" | "lt" | "ru";
  header: { email: string; firstName: string };
  sections: Record<string, number>;
  dates: Record<string, Array<[string, string]>>;
}

const EXPECTED = JSON.parse(
  readFileSync(path.join(DIR, "expected.json"), "utf-8"),
) as Expected[];

function plain(field: Field | undefined): string {
  return field?.kind === "plain" ? field.value : "";
}

function entriesOf(resume: Resume, type: string) {
  return (
    resume.sections.find((section) => section.type === type)?.entries ?? []
  );
}

interface Score {
  points: number;
  total: number;
  misses: string[];
}

function score(draft: ImportDraft, expected: Expected): Score {
  const checks: Array<[string, boolean]> = [];
  for (const [type, count] of Object.entries(expected.sections)) {
    const entries = entriesOf(draft.resume, type);
    checks.push([`section ${type} found`, entries.length > 0]);
    checks.push([
      `section ${type} has ${count} (got ${entries.length})`,
      entries.length === count,
    ]);
  }
  for (const [type, pairs] of Object.entries(expected.dates)) {
    const entries = entriesOf(draft.resume, type);
    pairs.forEach(([start, end], index) => {
      const entry = entries[index];
      const got = `${plain(entry?.fields.startDate)} – ${plain(entry?.fields.endDate)}`;
      checks.push([
        `${type}[${index}] dates ${start} – ${end} (got ${got})`,
        plain(entry?.fields.startDate) === start &&
          plain(entry?.fields.endDate) === end,
      ]);
    });
  }
  checks.push([
    "header email",
    plain(draft.resume.header.fields.email) === expected.header.email,
  ]);
  checks.push([
    "header first name",
    plain(draft.resume.header.fields.firstName) === expected.header.firstName,
  ]);
  return {
    points: checks.filter(([, ok]) => ok).length,
    total: checks.length,
    misses: checks.filter(([, ok]) => !ok).map(([label]) => label),
  };
}

const FURNITURE = [
  "cvbankas",
  "hh.ru",
  "rabota.ua",
  "Curriculum Vitae",
  "gyvenimo aprašymas",
  "SAMPLE",
  "ОБРАЗЕЦ",
  "Puslapis",
  "Страница",
];

async function load(name: string): Promise<ImportDraft> {
  const bytes = new Uint8Array(readFileSync(path.join(DIR, `${name}.pdf`)));
  const result = await importPdf(bytes, {
    title: name,
    language: "en",
    templateId: "standard",
  });
  return R.getExn(result);
}

describe("PDF import on the fixture set", () => {
  it("recognizes sections and dates in at least 90% of cases", async () => {
    const results = await Promise.all(
      EXPECTED.map(async (expected) => ({
        expected,
        score: score(await load(expected.name), expected),
      })),
    );
    const points = results.reduce((sum, item) => sum + item.score.points, 0);
    const total = results.reduce((sum, item) => sum + item.score.total, 0);
    const accuracy = points / total;
    const report = results
      .map(
        (item) =>
          `${item.expected.name}: ${item.score.points}/${item.score.total}${
            item.score.misses.length
              ? `\n    - ${item.score.misses.join("\n    - ")}`
              : ""
          }`,
      )
      .join("\n");
    console.log(`Import accuracy ${(accuracy * 100).toFixed(1)}%\n${report}`);
    expect(accuracy).toBeGreaterThanOrEqual(0.9);
  }, 60_000);

  it("keeps page furniture out of the content", async () => {
    for (const expected of EXPECTED) {
      const draft = await load(expected.name);
      const text = resumeToText(resumeToPreview(draft.resume));
      for (const word of FURNITURE) {
        expect(text, `${expected.name} leaks "${word}"`).not.toContain(word);
      }
    }
  }, 60_000);

  it("keeps tenure badges as metadata, not content", async () => {
    const draft = await load("01-labels-lt-portal");
    const text = resumeToText(resumeToPreview(draft.resume));
    expect(text).not.toContain("4 metai 2 mėnesiai");
    expect(draft.metadata.map((item) => item.text)).toContain(
      "4 metai 2 mėnesiai",
    );
  });

  it("flags a scan without a text layer", async () => {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.create();
    doc.addPage();
    const bytes = await doc.save();
    const result = await importPdf(bytes, {
      title: "scan",
      language: "en",
      templateId: "standard",
    });
    expect(R.getExn(R.flip(result))).toBe("no-text");
  });
});
