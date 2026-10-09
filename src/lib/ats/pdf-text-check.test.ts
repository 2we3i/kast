import { describe, expect, it } from "vitest";
import { buildResumeBlocks } from "@/components/editor/resume-blocks";
import { resumeToPreview } from "@/components/editor/resume-to-preview";
import { resumeToText } from "@/components/editor/resume-to-text";
import { sampleResume } from "@/lib/resume/seed-samples";
import { checkPdfText, expectedValues, normalizeText } from "./pdf-text-check";

function ordered(values: ReadonlyArray<string>) {
  return values.map((value) => ({ value, ordered: true }));
}

describe("PDF text-layer check", () => {
  it("collapses whitespace and case", () => {
    expect(normalizeText("  Senior\n  Frontend   ENGINEER ")).toBe(
      "senior frontend engineer",
    );
  });

  it("passes text that contains every value in order", () => {
    const report = checkPdfText(
      "Jonas Petraitis\nDesigner\nEXPERIENCE\nAcme",
      ordered(["Jonas Petraitis", "Designer", "Experience", "Acme"]),
    );
    expect(report).toEqual({ total: 4, missing: [], inOrder: true });
  });

  it("only needs header contacts to be present", () => {
    const report = checkPdfText("Jonas\njonas@example.com\nDesigner", [
      { value: "Designer", ordered: false },
      { value: "jonas@example.com", ordered: false },
      { value: "Jonas", ordered: true },
    ]);
    expect(report.inOrder).toBe(true);
    expect(report.missing).toEqual([]);
  });

  it("reports values the text lacks", () => {
    const report = checkPdfText(
      "Jonas Petraitis",
      ordered(["Jonas Petraitis", "Acme"]),
    );
    expect(report.missing).toEqual(["Acme"]);
  });

  it("notices when sections come out of order", () => {
    const report = checkPdfText(
      "Education\nExperience",
      ordered(["Experience", "Education"]),
    );
    expect(report.inOrder).toBe(false);
    expect(report.missing).toEqual([]);
  });

  for (const language of ["en", "lt", "ru"] as const) {
    it(`${language}: the plain-text export reads in order`, () => {
      const preview = resumeToPreview(sampleResume(language));
      const expected = expectedValues(buildResumeBlocks(preview));
      expect(expected.length).toBeGreaterThan(10);
      const report = checkPdfText(resumeToText(preview), expected);
      expect(report.missing).toEqual([]);
      expect(report.inOrder).toBe(true);
    });
  }
});
