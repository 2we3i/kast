import { describe, expect, it } from "vitest";
import { resumeToPreview } from "@/components/editor/resume-to-preview";
import { resumeToText } from "@/components/editor/resume-to-text";
import type { Resume } from "@/lib/resume/types";
import {
  bullets,
  emptyResume,
  paragraph,
  plain,
  seedResume,
  withSection,
} from "../../../tests/unit/fixtures";
import { ATS_CONFIG, RULE_CHECKS, runAtsCheck } from "./check";
import { extractKeywords, matchKeywords, stem } from "./keywords";

const NOW = new Date("2026-10-01T00:00:00Z");

function check(resume: Resume, jobDescription = "", pageCount = 1) {
  return runAtsCheck({
    resume,
    text: resumeToText(resumeToPreview(resume)),
    pageCount,
    jobDescription,
    now: NOW,
  });
}

function ruleIds(resume: Resume, jobDescription = "") {
  return check(resume, jobDescription).issues.map((issue) => issue.ruleId);
}

describe("ATS configuration", () => {
  it("has an implementation for every configured rule", () => {
    for (const rule of ATS_CONFIG.rules) {
      expect(RULE_CHECKS[rule.id], rule.id).toBeTypeOf("function");
    }
  });

  it("only uses known categories", () => {
    const categories = Object.keys(ATS_CONFIG.categories);
    for (const rule of ATS_CONFIG.rules) {
      expect(categories).toContain(rule.category);
    }
  });
});

describe("runAtsCheck", () => {
  it("scores the seed résumé high", () => {
    const report = check(seedResume());
    expect(report.score).toBeGreaterThanOrEqual(80);
    expect(report.score).toBeLessThanOrEqual(100);
  });

  it("scores an empty résumé low and names the missing basics", () => {
    const report = check(emptyResume());
    expect(report.score).toBeLessThan(50);
    const ids = report.issues.map((issue) => issue.ruleId);
    expect(ids).toContain("name-present");
    expect(ids).toContain("email-present");
    expect(ids).toContain("required-sections");
  });

  it("skips the keyword category without a vacancy", () => {
    const report = check(seedResume());
    expect(report.categories.keywords.score).toBeNull();
    expect(report.keywords).toBeNull();
  });

  it("orders issues by severity", () => {
    const order = { error: 0, warning: 1, info: 2 };
    const severities = check(emptyResume()).issues.map(
      (i) => order[i.severity],
    );
    expect([...severities].sort()).toEqual(severities);
  });

  it("flags a malformed email and phone", () => {
    const resume = seedResume();
    const broken = {
      ...resume,
      header: {
        ...resume.header,
        fields: {
          ...resume.header.fields,
          email: plain("john.doe(at)example"),
          phone: plain("12"),
        },
      },
    };
    const ids = ruleIds(broken);
    expect(ids).toContain("email-format");
    expect(ids).toContain("phone-format");
  });

  it("flags decorative bullets and emoji", () => {
    const resume = withSection(seedResume(), "summary", (section) => ({
      ...section,
      entries: [
        {
          id: "s",
          fields: { body: paragraph("★ Product engineer 🚀 shipping fast") },
        },
      ],
    }));
    const ids = ruleIds(resume);
    expect(ids).toContain("special-bullets");
    expect(ids).toContain("emoji");
  });

  it("flags design mode as a format warning", () => {
    expect(ruleIds({ ...seedResume(), atsMode: false })).toContain("ats-mode");
  });

  it("finds weak phrases in Russian and Lithuanian résumés", () => {
    const ru = withSection(
      { ...seedResume(), language: "ru" },
      "summary",
      (section) => ({
        ...section,
        entries: [
          { id: "s", fields: { body: paragraph("Отвечал за склад и учёт.") } },
        ],
      }),
    );
    expect(ruleIds(ru)).toContain("weak-phrases");
    const lt = withSection(
      { ...seedResume(), language: "lt" },
      "summary",
      (section) => ({
        ...section,
        entries: [
          {
            id: "s",
            fields: { body: paragraph("Buvau atsakingas už sandėlį.") },
          },
        ],
      }),
    );
    expect(ruleIds(lt)).toContain("weak-phrases");
  });

  it("detects reversed dates and gaps over six months", () => {
    const noInternships = withSection(
      seedResume(),
      "internship",
      (section) => ({
        ...section,
        entries: [],
      }),
    );
    const resume = withSection(noInternships, "experience", (section) => ({
      ...section,
      entries: [
        {
          id: "a",
          fields: {
            title: plain("Engineer"),
            company: plain("Acme"),
            startDate: plain("Jan 2024"),
            endDate: plain("Present"),
            description: bullets("Built X", "Shipped Y"),
          },
        },
        {
          id: "b",
          fields: {
            title: plain("Developer"),
            company: plain("Globex"),
            startDate: plain("Jan 2020"),
            endDate: plain("Jan 2022"),
            description: bullets("Built X", "Shipped Y"),
          },
        },
        {
          id: "c",
          fields: {
            title: plain("Intern"),
            company: plain("Initech"),
            startDate: plain("Jun 2019"),
            endDate: plain("Jan 2019"),
            description: bullets("Built X", "Shipped Y"),
          },
        },
      ],
    }));
    const report = check(resume);
    const gaps = report.issues.filter((i) => i.ruleId === "employment-gaps");
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.params?.months).toBe(23);
    expect(report.issues.map((i) => i.ruleId)).toContain("dates-order");
  });

  it("warns past two pages", () => {
    expect(check(seedResume(), "", 3).issues.map((i) => i.ruleId)).toContain(
      "page-count",
    );
  });

  it("reports found and missing vacancy keywords", () => {
    const report = check(
      seedResume(),
      "We need a Senior Frontend Engineer with TypeScript, React and Kubernetes. TypeScript daily, Kubernetes in production.",
    );
    expect(report.keywords?.found).toContain("typescript");
    expect(report.keywords?.missing).toContain("kubernetes");
    expect(report.categories.keywords.score).not.toBeNull();
  });
});

describe("keywords", () => {
  it("drops stopwords of every language", () => {
    const terms = extractKeywords(
      "Ieškome kandidato, kuris turi Python ir SQL žinių. Python būtinas.",
      ATS_CONFIG,
      10,
    );
    expect(terms[0]).toBe("python");
    expect(terms).toContain("sql");
    expect(terms).not.toContain("ir");
    expect(terms).not.toContain("kandidato");
  });

  it("keeps technical tokens like C++ and C#", () => {
    const terms = extractKeywords(
      "C++ and C# developer, C++ again",
      ATS_CONFIG,
      5,
    );
    expect(terms).toContain("c++");
    expect(terms).toContain("c#");
  });

  it("matches inflected Lithuanian and Russian forms by stem", () => {
    expect(stem("programavimas")).toBe(stem("programavimo"));
    const report = matchKeywords("Опыт программирования на Python", [
      "программирование",
      "python",
      "java",
    ]);
    expect(report.found).toEqual(["программирование", "python"]);
    expect(report.missing).toEqual(["java"]);
  });
});
