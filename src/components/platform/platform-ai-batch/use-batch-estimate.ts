import { A } from "@mobily/ts-belt";
import { useEffect, useState } from "react";
import { type CostEstimate, estimateCost } from "@/lib/ai/estimate";
import { prepareRequest } from "@/lib/ai/run";
import type { AiRunSettings } from "@/lib/ai/run-resume";
import { getResume } from "@/lib/db/resume";

type EstimateInput = Omit<AiRunSettings, "apiKey" | "baseUrl">;

/**
 * The combined token and cost estimate for running one task over the chosen
 * résumés, read from the stored documents. Null while they load.
 */
export function useBatchEstimate(
  ids: ReadonlyArray<string>,
  settings: EstimateInput,
): CostEstimate | null {
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const key = `${A.join(ids, ",")}|${JSON.stringify(settings)}`;

  // biome-ignore lint/correctness/useExhaustiveDependencies: `key` stands for ids and settings, which are rebuilt on every render
  useEffect(() => {
    let live = true;
    Promise.all(A.map(ids, (id) => getResume(id)))
      .then((resumes) => {
        if (!live) return;
        const totals = A.reduce(
          resumes,
          { inputTokens: 0, outputTokens: 0 },
          (sum, resume) => {
            if (!resume) return sum;
            const prepared = prepareRequest({
              mode: settings.mode,
              resume,
              vacancy: settings.vacancy || resume.target?.description || "",
              targetLanguage: settings.targetLanguage,
              uiLanguage: settings.uiLanguage,
              masking: settings.masking,
              localFindings: [],
            });
            return {
              inputTokens: sum.inputTokens + prepared.inputTokens,
              outputTokens: sum.outputTokens + prepared.outputTokens,
            };
          },
        );
        setEstimate(
          estimateCost({
            provider: settings.provider,
            model: settings.model,
            ...totals,
          }),
        );
      })
      .catch(() => setEstimate(null));
    return () => {
      live = false;
    };
  }, [key]);

  return estimate;
}
