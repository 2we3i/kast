import { A, O } from "@mobily/ts-belt";
import type { AiModelInfo, AiProviderId } from "./types";

/**
 * What the settings and the AI panel need to know about each provider,
 * without loading its client code. The adapters themselves load on the
 * first request (see providers/registry.ts).
 */
export interface AiProviderInfo {
  id: AiProviderId;
  label: string;
  defaultBaseUrl: string;
  /** What a key looks like, shown as the input placeholder. */
  keyHint: string;
  /** Where the user creates a key. */
  consoleUrl: string;
  models: ReadonlyArray<AiModelInfo>;
  defaultModel: string;
}

export const AI_PROVIDER_INFO: Record<AiProviderId, AiProviderInfo> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic Claude",
    defaultBaseUrl: "https://api.anthropic.com",
    keyHint: "sk-ant-…",
    consoleUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-opus-5-5",
    models: [
      {
        id: "claude-opus-5-5",
        label: "Claude Opus 5.5",
        inputPerMillion: 4,
        outputPerMillion: 20,
      },
      {
        id: "claude-sonnet-5-5",
        label: "Claude Sonnet 5.5",
        inputPerMillion: 2,
        outputPerMillion: 10,
      },
      {
        id: "claude-haiku-5-5",
        label: "Claude Haiku 5.5",
        inputPerMillion: 0.1,
        outputPerMillion: 0.5,
      },
      {
        id: "claude-fable-5-1",
        label: "Claude Fable 5.1",
        inputPerMillion: 10,
        outputPerMillion: 50,
      },
    ],
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    defaultBaseUrl: "https://generativelanguage.googleapis.com",
    keyHint: "AIza…",
    consoleUrl: "https://aistudio.google.com/apikey",
    defaultModel: "gemini-2.5-flash",
    models: [
      {
        id: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        inputPerMillion: 0.3,
        outputPerMillion: 2.5,
      },
      {
        id: "gemini-2.5-pro",
        label: "Gemini 2.5 Pro",
        inputPerMillion: 1.25,
        outputPerMillion: 10,
      },
      {
        id: "gemini-2.5-flash-lite",
        label: "Gemini 2.5 Flash-Lite",
        inputPerMillion: 0.1,
        outputPerMillion: 0.4,
      },
      {
        id: "gemini-3-pro-preview",
        label: "Gemini 3 Pro (preview)",
        inputPerMillion: 2,
        outputPerMillion: 12,
      },
    ],
  },
};

export const AI_PROVIDER_IDS: ReadonlyArray<AiProviderId> = [
  "anthropic",
  "gemini",
];

/** A model's prices, or None for a model typed in by hand. */
export function modelInfo(
  provider: AiProviderId,
  model: string,
): O.Option<AiModelInfo> {
  return A.find(AI_PROVIDER_INFO[provider].models, (item) => item.id === model);
}

/** Origins a request may go to: the providers', plus a user-set endpoint. */
export function providerOrigins(customBaseUrls: ReadonlyArray<string>) {
  return A.uniq(
    A.concat(
      A.map(
        A.map(AI_PROVIDER_IDS, (id) => AI_PROVIDER_INFO[id]),
        (info) => new URL(info.defaultBaseUrl).origin,
      ),
      A.filterMap(customBaseUrls, (value) => {
        try {
          const url = new URL(value);
          return url.protocol === "https:" ? O.Some(url.origin) : O.None;
        } catch {
          return O.None;
        }
      }),
    ),
  );
}
