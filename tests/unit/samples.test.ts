import { describe, expect, it } from "vitest";
import { buildResumeDocx } from "@/components/editor/docx/resume-to-docx";
import { resumeToPreview } from "@/components/editor/resume-to-preview";
import { resumeToText } from "@/components/editor/resume-to-text";
import { runAtsCheck } from "@/lib/ats/check";
import { RESUME_LANGUAGES } from "@/lib/resume/labels";
import { sampleResume } from "@/lib/resume/seed-samples";

const NOW = new Date("2026-10-01T00:00:00Z");

/** Every string field of the header, flattened. */
function headerValues(language: (typeof RESUME_LANGUAGES)[number]) {
  return Object.values(sampleResume(language).header.fields).flatMap((field) =>
    field && field.kind === "plain" ? [field.value] : [],
  );
}

describe("sample résumés", () => {
  for (const language of RESUME_LANGUAGES) {
    it(`${language}: is written in its own language`, () => {
      expect(sampleResume(language).language).toBe(language);
    });

    it(`${language}: scores well in the ATS check`, () => {
      const resume = sampleResume(language);
      const report = runAtsCheck({
        resume,
        text: resumeToText(resumeToPreview(resume)),
        pageCount: 1,
        jobDescription: "",
        now: NOW,
      });
      expect(report.score).toBeGreaterThanOrEqual(80);
    });

    it(`${language}: carries placeholder contacts only`, () => {
      const values = headerValues(language);
      const emails = values.filter((value) => value.includes("@"));
      for (const email of emails) expect(email).toMatch(/@example\.com$/);
      const phones = values.filter((value) => /^\+?[\d\s]{7,}$/.test(value));
      // All zeros, or the unassigned US 555 area code of the English sample.
      for (const phone of phones) {
        expect(phone.replace(/\D/g, "")).toMatch(/0{5}$|^1555/);
      }
      expect(sampleResume(language).header.photo).toBeUndefined();
    });

    it(`${language}: renders to text and Word without errors`, async () => {
      const preview = resumeToPreview(sampleResume(language));
      expect(resumeToText(preview).length).toBeGreaterThan(400);
      const document = buildResumeDocx(preview, "standard");
      expect(document).toBeTruthy();
    });
  }
});
