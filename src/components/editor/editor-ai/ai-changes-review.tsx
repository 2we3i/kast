import { A, D, O, pipe } from "@mobily/ts-belt";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import { type AiChange, applyAiChanges } from "@/lib/ai/ai-view";
import type { AiChangeProposal } from "@/lib/ai/schemas";
import type { ResumeLanguage } from "@/lib/resume/types";
import { useResumeStore } from "@/lib/store";
import { AiChangeItem, type ChangeDecision } from "./ai-change-item";
import { useFieldLabel } from "./use-field-label";

interface AiChangesReviewProps {
  changes: ReadonlyArray<AiChangeProposal>;
  before: Record<string, string>;
  /** History label for the snapshot taken before applying. */
  snapshotLabel: string;
  /** A translation also switches the document's own language when applied. */
  switchLanguageTo?: ResumeLanguage;
  onApplied: () => void;
}

/**
 * The review list for proposed changes. Nothing reaches the résumé until the
 * user applies the ones they accepted; the state before is saved to history
 * first, and the whole application is one undo step.
 */
export function AiChangesReview(props: AiChangesReviewProps) {
  const applyExternalEdit = useResumeStore((state) => state.applyExternalEdit);
  const takeSnapshot = useResumeStore((state) => state.takeSnapshot);
  const fieldLabel = useFieldLabel();
  const t = useTranslations("ai.review");
  const [decisions, setDecisions] = useState<Record<string, ChangeDecision>>(
    {},
  );

  const accepted = pipe(
    props.changes,
    A.filterMap((change): O.Option<AiChange> => {
      const decision = decisions[change.path];
      if (decision?.status !== "accepted") return O.None;
      return O.Some({ path: change.path, after: decision.text });
    }),
  );

  function decide(path: string, decision: ChangeDecision) {
    setDecisions((current) => D.set(current, path, decision));
  }

  function acceptAll() {
    setDecisions(
      pipe(
        props.changes,
        A.map(
          (change) =>
            [
              change.path,
              { status: "accepted", text: change.after } as ChangeDecision,
            ] as const,
        ),
        D.fromPairs,
      ),
    );
  }

  async function apply() {
    await takeSnapshot("before-ai", props.snapshotLabel);
    applyExternalEdit((resume) => {
      const changed = applyAiChanges(resume, accepted);
      if (!props.switchLanguageTo) return changed;
      return { ...changed, language: props.switchLanguageTo };
    });
    props.onApplied();
  }

  if (A.isEmpty(props.changes)) {
    return <p className="text-sm text-muted-foreground">{t("noChanges")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {t("changesHeading", { count: A.length(props.changes) })}
        </p>
        <Button size="sm" variant="ghost" onClick={acceptAll}>
          {t("acceptAll")}
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {props.changes.map((change) => (
          <AiChangeItem
            key={change.path}
            change={change}
            before={props.before[change.path] ?? ""}
            label={fieldLabel(change.path)}
            decision={decisions[change.path] ?? { status: "pending" }}
            onDecide={(decision) => decide(change.path, decision)}
          />
        ))}
      </ul>
      <Button disabled={A.isEmpty(accepted)} onClick={() => void apply()}>
        <CheckCircleIcon /> {t("apply", { count: A.length(accepted) })}
      </Button>
      <p className="text-xs text-muted-foreground">{t("applyNote")}</p>
    </div>
  );
}
