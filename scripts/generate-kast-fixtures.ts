/**
 * Round-trip fixtures: the three sample résumés rendered to PDF by Kast's own
 * export engine, in a few templates and both modes, then added to the import
 * fixture set with their expected sections and dates. Importing a PDF that
 * Kast itself produced must work as well as importing a portal export.
 * The samples are fictional, like every fixture.
 *   pnpm fixtures:kast
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { A, pipe } from "@mobily/ts-belt";
import { byRecency } from "@/components/editor/resume-sort";
import { resumeToPreview } from "@/components/editor/resume-to-preview";
import { sampleResume } from "@/lib/resume/seed-samples";
import type { Field, Resume, ResumeLanguage } from "@/lib/resume/types";
import type { TemplateId } from "@/lib/templates";
import { loadTakumiRenderer } from "./load-takumi-renderer";

const DIR = join(process.cwd(), "tests/fixtures/import");

interface Variant {
  name: string;
  language: ResumeLanguage;
  template: TemplateId;
  atsMode: boolean;
}

const VARIANTS: ReadonlyArray<Variant> = [
  {
    name: "17-kast-standard-en",
    language: "en",
    template: "standard",
    atsMode: true,
  },
  {
    name: "18-kast-modern-lt",
    language: "lt",
    template: "modern",
    atsMode: false,
  },
  {
    name: "19-kast-timeline-ru",
    language: "ru",
    template: "timeline",
    atsMode: true,
  },
  {
    name: "20-kast-classic-ru",
    language: "ru",
    template: "classic",
    atsMode: false,
  },
];

function plain(field: Field | undefined): string {
  return field?.kind === "plain" ? field.value : "";
}

/** Sections and dates the import should recover from `resume`. */
function expectedFor(name: string, resume: Resume) {
  const sections = Object.fromEntries(
    resume.sections
      .filter((section) => section.entries.length > 0 && !section.hidden)
      .map((section) => [section.type, section.entries.length]),
  );
  const dates = Object.fromEntries(
    (["experience", "education"] as const).map((type) => [
      type,
      // The documents list entries newest first, as the preview does.
      pipe(
        resume.sections.find((section) => section.type === type)?.entries ?? [],
        A.map((entry) => ({
          startDate: plain(entry.fields.startDate),
          endDate: plain(entry.fields.endDate),
        })),
        A.sort(byRecency),
        A.map((dates) => [dates.startDate, dates.endDate]),
      ),
    ]),
  );
  return {
    name,
    language: resume.language,
    header: {
      email: plain(resume.header.fields.email),
      firstName: plain(resume.header.fields.firstName),
    },
    sections,
    dates,
  };
}

async function main() {
  const renderer = await loadTakumiRenderer();
  const expectedPath = join(DIR, "expected.json");
  const existing = (
    JSON.parse(readFileSync(expectedPath, "utf8")) as Array<{ name: string }>
  ).filter((entry) => !entry.name.includes("-kast-"));
  const added = [];
  try {
    for (const variant of VARIANTS) {
      const resume: Resume = {
        ...sampleResume(variant.language),
        templateId: variant.template,
        atsMode: variant.atsMode,
      };
      const bytes = await renderer.render({
        preview: resumeToPreview(resume),
        template: variant.template,
        readFile: renderer.readFontFile,
      });
      writeFileSync(join(DIR, `${variant.name}.pdf`), bytes);
      added.push(expectedFor(variant.name, resume));
      console.log(
        `  ✓ ${variant.name}.pdf (${Math.round(bytes.length / 1024)} KB)`,
      );
    }
  } finally {
    await renderer.close();
  }
  writeFileSync(
    expectedPath,
    `${JSON.stringify([...existing, ...added], null, 2)}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
