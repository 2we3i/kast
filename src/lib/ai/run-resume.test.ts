import { R } from "@mobily/ts-belt";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { seedResume } from "../../../tests/unit/fixtures";
import { DEFAULT_MASK_OPTIONS } from "./masking";
import type { AiRunSettings } from "./run-resume";
import type { AiProviderAdapter } from "./types";

const generate = vi.fn();
vi.mock("./providers/registry", () => ({
  loadProvider: async (): Promise<AiProviderAdapter> => ({
    verifyKey: async () => R.makeOk(true),
    generate,
  }),
}));

// The first import pulls in the ATS check, the preview, and the SDK types;
// warm it once so no single test pays for it against the default timeout.
beforeAll(async () => {
  await import("./run-resume");
}, 60_000);

afterEach(() => generate.mockReset());

const SETTINGS: AiRunSettings = {
  mode: "tailor",
  provider: "anthropic",
  model: "claude-haiku-5-5",
  apiKey: "test-key",
  baseUrl: "",
  masking: DEFAULT_MASK_OPTIONS,
  targetLanguage: "en",
  uiLanguage: "en",
};

const ANSWER = R.makeOk({
  value: { changes: [], questions: [], missingKeywords: [] },
  usage: { inputTokens: 120, outputTokens: 40 },
});

describe("runAiOnResume", () => {
  it("shapes the answer as a pending result for that résumé", async () => {
    generate.mockResolvedValueOnce(ANSWER);
    const { runAiOnResume } = await import("./run-resume");
    const resume = seedResume();
    const result = await runAiOnResume(
      resume,
      { ...SETTINGS, vacancy: "Senior designer, Figma" },
      { pageCount: 1, signal: new AbortController().signal },
    );
    expect(R.isOk(result)).toBe(true);
    const pending = R.getExn(result);
    expect(pending.resumeId).toBe(resume.id);
    expect(pending.mode).toBe("tailor");
    expect(pending.usage).toEqual({ inputTokens: 120, outputTokens: 40 });
    expect(Object.keys(pending.before).length).toBeGreaterThan(0);
  });

  it("falls back to the résumé's own vacancy note", async () => {
    generate.mockResolvedValueOnce(ANSWER);
    const { runAiOnResume } = await import("./run-resume");
    const resume = {
      ...seedResume(),
      target: {
        company: "",
        position: "",
        url: "",
        appliedAt: "",
        status: "draft" as const,
        notes: "",
        description: "Logistics coordinator, Incoterms",
      },
    };
    await runAiOnResume(resume, SETTINGS, {
      pageCount: 1,
      signal: new AbortController().signal,
    });
    const prompt = generate.mock.calls[0]?.[0].prompt as string;
    expect(prompt).toContain("Logistics coordinator, Incoterms");
  });

  it("passes provider errors through", async () => {
    generate.mockResolvedValueOnce(
      R.makeError({ kind: "rate-limit", detail: "slow down" }),
    );
    const { runAiOnResume } = await import("./run-resume");
    const result = await runAiOnResume(seedResume(), SETTINGS, {
      pageCount: 1,
      signal: new AbortController().signal,
    });
    expect(R.isError(result)).toBe(true);
    expect(R.getExn(R.flip(result)).kind).toBe("rate-limit");
  });
});
