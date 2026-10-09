import { A } from "@mobily/ts-belt";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AI_PROVIDER_INFO } from "@/lib/ai/catalog";
import { DEFAULT_MASK_OPTIONS, type MaskOptions } from "@/lib/ai/masking";
import type { AiMode } from "@/lib/ai/prompts";
import type { AiRunOutput } from "@/lib/ai/run";
import type { AiProviderId, AiUsage } from "@/lib/ai/types";
import type { ResumeLanguage } from "@/lib/resume/types";

/** localStorage key of the persisted AI settings; the CSP bootstrap reads it. */
export const AI_SETTINGS_KEY = "kast:ai-settings";

export interface AiSettings {
  provider: AiProviderId;
  /** The chosen model per provider; a custom id is allowed. */
  models: Record<AiProviderId, string>;
  /** A user-set endpoint per provider (their own proxy), or empty. */
  baseUrls: Record<AiProviderId, string>;
  masking: MaskOptions;
  /** When each provider was consented to (ISO 8601), or absent. */
  consent: Partial<Record<AiProviderId, string>>;
  /** How many résumés one batch run may process. */
  batchLimit: number;
}

/** One finished AI run waiting for the user's review. */
export interface PendingAiResult {
  id: string;
  resumeId: string;
  mode: AiMode;
  provider: AiProviderId;
  model: string;
  createdAt: string;
  output: AiRunOutput;
  usage: AiUsage;
  /** Field text as it was when sent, by path: the "before" of each change. */
  before: Record<string, string>;
  /** For a translation: the language the document switches to on apply. */
  targetLanguage?: ResumeLanguage;
}

interface AiState extends AiSettings {
  /** Keys live here, in memory only, unless the user unlocks a stored one. */
  keys: Partial<Record<AiProviderId, string>>;
  mode: AiMode;
  targetLanguage: ResumeLanguage;
  results: ReadonlyArray<PendingAiResult>;
  setProvider: (provider: AiProviderId) => void;
  setModel: (provider: AiProviderId, model: string) => void;
  setBaseUrl: (provider: AiProviderId, url: string) => void;
  setMasking: (masking: MaskOptions) => void;
  grantConsent: (provider: AiProviderId) => void;
  revokeConsent: (provider: AiProviderId) => void;
  setKey: (provider: AiProviderId, key: string | null) => void;
  setMode: (mode: AiMode) => void;
  setTargetLanguage: (language: ResumeLanguage) => void;
  setBatchLimit: (limit: number) => void;
  addResult: (result: PendingAiResult) => void;
  dismissResult: (id: string) => void;
}

const DEFAULT_SETTINGS: AiSettings = {
  provider: "anthropic",
  models: {
    anthropic: AI_PROVIDER_INFO.anthropic.defaultModel,
    gemini: AI_PROVIDER_INFO.gemini.defaultModel,
  },
  baseUrls: { anthropic: "", gemini: "" },
  masking: DEFAULT_MASK_OPTIONS,
  consent: {},
  batchLimit: 5,
};

/**
 * AI settings and session state. Settings persist in localStorage; keys never
 * do (see key-vault.ts for the opt-in encrypted copy); pending results live in
 * sessionStorage, so a reload keeps them but closing the tab forgets them.
 */
export const useAiStore = create<AiState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      keys: {},
      mode: "rewrite",
      targetLanguage: "en",
      results: [],
      setProvider: (provider) => set({ provider }),
      setModel: (provider, model) =>
        set((state) => ({ models: { ...state.models, [provider]: model } })),
      setBaseUrl: (provider, url) =>
        set((state) => ({ baseUrls: { ...state.baseUrls, [provider]: url } })),
      setMasking: (masking) => set({ masking }),
      grantConsent: (provider) =>
        set((state) => ({
          consent: { ...state.consent, [provider]: new Date().toISOString() },
        })),
      revokeConsent: (provider) =>
        set((state) => ({
          consent: { ...state.consent, [provider]: undefined },
        })),
      setKey: (provider, key) =>
        set((state) => ({
          keys: { ...state.keys, [provider]: key ?? undefined },
        })),
      setMode: (mode) => set({ mode }),
      setTargetLanguage: (targetLanguage) => set({ targetLanguage }),
      setBatchLimit: (batchLimit) =>
        set({ batchLimit: Math.min(5, Math.max(1, batchLimit)) }),
      addResult: (result) =>
        set((state) => ({ results: A.prepend(state.results, result) })),
      dismissResult: (id) =>
        set((state) => ({
          results: A.reject(state.results, (result) => result.id === id),
        })),
    }),
    {
      name: AI_SETTINGS_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Keys and results never reach localStorage.
      partialize: (state) => ({
        provider: state.provider,
        models: state.models,
        baseUrls: state.baseUrls,
        masking: state.masking,
        consent: state.consent,
        batchLimit: state.batchLimit,
        mode: state.mode,
        targetLanguage: state.targetLanguage,
      }),
    },
  ),
);

/** Pending results, kept for the tab's lifetime in sessionStorage. */
export const AI_RESULTS_KEY = "kast:ai-results";

export function persistResults(results: ReadonlyArray<PendingAiResult>): void {
  try {
    sessionStorage.setItem(AI_RESULTS_KEY, JSON.stringify(results));
  } catch {
    // Storage blocked: results last until the page reloads.
  }
}

export function restoreResults(): ReadonlyArray<PendingAiResult> {
  try {
    const raw = sessionStorage.getItem(AI_RESULTS_KEY);
    return raw ? (JSON.parse(raw) as ReadonlyArray<PendingAiResult>) : [];
  } catch {
    return [];
  }
}

// Results go to sessionStorage, not with the settings to localStorage: a
// reload keeps them, closing the tab forgets them.
if (typeof window !== "undefined") {
  useAiStore.setState({ results: restoreResults() });
  useAiStore.subscribe((state, previous) => {
    if (state.results !== previous.results) persistResults(state.results);
  });
}
