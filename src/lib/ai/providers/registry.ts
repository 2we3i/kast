import type { AiProviderAdapter, AiProviderId } from "../types";

/**
 * Loads a provider's adapter on first use, so the SDKs stay out of every page
 * bundle until someone actually sends a request.
 */
export async function loadProvider(
  id: AiProviderId,
): Promise<AiProviderAdapter> {
  if (id === "anthropic") {
    const { anthropicProvider } = await import("./anthropic");
    return anthropicProvider;
  }
  const { geminiProvider } = await import("./gemini");
  return geminiProvider;
}
