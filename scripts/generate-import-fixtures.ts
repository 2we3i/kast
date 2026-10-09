import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument } from "pdf-lib";
import { type FixtureResume, PEOPLE } from "./import-fixtures/fixture-content";
import {
  labelsLayout,
  sidebarLayout,
  singleLayout,
} from "./import-fixtures/layouts";
import { type Furniture, Writer } from "./import-fixtures/render";

/**
 * Generates the PDF import test set: sixteen fictional résumés across three
 * languages and four layouts, with portal footers, running headers, page
 * numbers, and watermarks, plus the structure each one should import as.
 * Run: pnpm fixtures:import
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const out = path.join(root, "tests", "fixtures", "import");

type Layout =
  | { kind: "labels" }
  | { kind: "single"; variant: "a" | "b"; bullets: boolean; size?: number }
  | { kind: "sidebar"; side: "left" | "right" };

interface Fixture {
  name: string;
  person: FixtureResume;
  layout: Layout;
  font: "Carlito" | "Inter" | "Arimo" | "Tinos";
  furniture?: Furniture;
}

const FIXTURES: Fixture[] = [
  {
    name: "01-labels-lt-portal",
    person: PEOPLE.lt,
    layout: { kind: "labels" },
    font: "Carlito",
    furniture: {
      footer: "CV sukurta su cvbankas.lt",
      pageNumber: (n, t) => `${n}/${t}`,
    },
  },
  {
    name: "02-labels-ru",
    person: PEOPLE.ru,
    layout: { kind: "labels" },
    font: "Inter",
    furniture: { pageNumber: (n, t) => `Страница ${n} из ${t}` },
  },
  {
    name: "03-labels-en",
    person: PEOPLE.en,
    layout: { kind: "labels" },
    font: "Arimo",
  },
  {
    name: "04-single-a-en",
    person: PEOPLE.en,
    layout: { kind: "single", variant: "a", bullets: true },
    font: "Carlito",
  },
  {
    name: "05-single-b-en",
    person: PEOPLE.en,
    layout: { kind: "single", variant: "b", bullets: true },
    font: "Tinos",
  },
  {
    name: "06-single-a-ru",
    person: PEOPLE.ru,
    layout: { kind: "single", variant: "a", bullets: true },
    font: "Inter",
  },
  {
    name: "07-single-b-lt",
    person: PEOPLE.lt,
    layout: { kind: "single", variant: "b", bullets: true },
    font: "Arimo",
  },
  {
    name: "08-sidebar-left-en",
    person: PEOPLE.en,
    layout: { kind: "sidebar", side: "left" },
    font: "Inter",
  },
  {
    name: "09-sidebar-left-ru",
    person: PEOPLE.ru,
    layout: { kind: "sidebar", side: "left" },
    font: "Carlito",
  },
  {
    name: "10-sidebar-right-lt",
    person: PEOPLE.lt,
    layout: { kind: "sidebar", side: "right" },
    font: "Arimo",
  },
  {
    name: "11-watermark-en",
    person: PEOPLE.en,
    layout: { kind: "single", variant: "a", bullets: true },
    font: "Carlito",
    furniture: {
      header: "Alex Sample — Curriculum Vitae",
      watermark: "SAMPLE",
      pageNumber: (n) => `Page ${n}`,
    },
  },
  {
    name: "12-watermark-ru",
    person: PEOPLE.ru,
    layout: { kind: "single", variant: "b", bullets: true },
    font: "Inter",
    furniture: {
      watermark: "ОБРАЗЕЦ",
      footer: "Создано на hh.ru",
      pageNumber: (n, t) => `${n}/${t}`,
    },
  },
  {
    name: "13-labels-lt-pages",
    person: PEOPLE.lt,
    layout: { kind: "labels" },
    font: "Inter",
    furniture: {
      header: "Ona Pavyzdytė — gyvenimo aprašymas",
      pageNumber: (n, t) => `Puslapis ${n} iš ${t}`,
    },
  },
  {
    name: "14-single-b-ru-portal",
    person: PEOPLE.ru,
    layout: { kind: "single", variant: "b", bullets: false },
    font: "Tinos",
    furniture: { footer: "Резюме скачано с rabota.ua" },
  },
  {
    name: "15-sidebar-left-lt",
    person: PEOPLE.lt,
    layout: { kind: "sidebar", side: "left" },
    font: "Tinos",
  },
  {
    name: "16-single-a-en-compact",
    person: PEOPLE.en,
    layout: { kind: "single", variant: "a", bullets: false, size: 8.5 },
    font: "Arimo",
  },
];

function fontFile(
  family: Fixture["font"],
  weight: "Regular" | "Bold",
): Uint8Array {
  return new Uint8Array(
    readFileSync(path.join(root, "public", "fonts", `${family}-${weight}.ttf`)),
  );
}

/** What the importer should find: sections with entry counts, and dates. */
function expected(fixture: Fixture) {
  const r = fixture.person;
  const labels = fixture.layout.kind === "labels";
  const sections: Record<string, number> = {
    summary: 1,
    experience: r.jobs.length,
    education: r.schools.length,
    skills:
      fixture.layout.kind === "labels" ? r.skills.length : r.skills.length,
    languages: r.languages.length,
  };
  if (labels) {
    if (r.references?.length) sections.references = r.references.length;
    if (r.salary) sections.salary = 1;
    if (r.availability) sections.availability = 1;
    if (r.driving) sections.driving = 1;
    if (r.interests) sections.interests = 1;
  }
  return {
    name: fixture.name,
    language: r.lang,
    header: { email: r.email, firstName: r.name.split(" ")[0] },
    sections,
    dates: {
      experience: r.jobs.map((job) => [job.start, job.end]),
      education: r.schools.map((school) => [school.start, school.end]),
    },
  };
}

async function build(fixture: Fixture): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(`Fictional résumé ${fixture.name}`);
  doc.setProducer("Kast import fixtures");
  const fonts = {
    regular: await doc.embedFont(fontFile(fixture.font, "Regular"), {
      subset: true,
    }),
    bold: await doc.embedFont(fontFile(fixture.font, "Bold"), { subset: true }),
  };
  const writer = new Writer(doc, fonts, fixture.furniture);
  if (fixture.layout.kind === "labels") labelsLayout(writer, fixture.person);
  if (fixture.layout.kind === "single")
    singleLayout(writer, fixture.person, fixture.layout);
  if (fixture.layout.kind === "sidebar")
    sidebarLayout(writer, fixture.person, fixture.layout.side);
  if (fixture.name === "13-labels-lt-pages") {
    // Pad onto a third page so the running header and page numbers repeat.
    writer.addPage();
    writer.paragraph(fixture.person.summary, 86, 420, { size: 8 });
  }
  writer.finish();
  return doc.save({ useObjectStreams: false });
}

async function main(): Promise<void> {
  mkdirSync(out, { recursive: true });
  const expectations = [];
  for (const fixture of FIXTURES) {
    writeFileSync(path.join(out, `${fixture.name}.pdf`), await build(fixture));
    expectations.push(expected(fixture));
    console.log(`wrote ${fixture.name}.pdf`);
  }
  writeFileSync(
    path.join(out, "expected.json"),
    `${JSON.stringify(expectations, null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
