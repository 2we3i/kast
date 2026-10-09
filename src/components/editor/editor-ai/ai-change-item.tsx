import {
  CheckIcon,
  PencilSimpleIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AiChangeProposal } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";
import { AiDiffView } from "./ai-diff-view";

/** The user's call on one proposed change. */
export type ChangeDecision =
  | { status: "pending" }
  | { status: "accepted"; text: string }
  | { status: "rejected" }
  | { status: "editing"; text: string };

interface AiChangeItemProps {
  change: AiChangeProposal;
  before: string;
  label: string;
  decision: ChangeDecision;
  onDecide: (decision: ChangeDecision) => void;
}

/** One proposed change: where, before/after, why, and accept/reject/edit. */
export function AiChangeItem(props: AiChangeItemProps) {
  const { change, decision } = props;
  const t = useTranslations("ai.review");
  const after = decision.status === "accepted" ? decision.text : change.after;

  return (
    <li
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3",
        decision.status === "accepted" && "border-success/60 bg-success/5",
        decision.status === "rejected" && "opacity-60",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">{props.label}</p>
      {decision.status === "editing" ? (
        <Textarea
          aria-label={t("editLabel")}
          rows={6}
          value={decision.text}
          onChange={(event) =>
            props.onDecide({ status: "editing", text: event.target.value })
          }
        />
      ) : (
        <AiDiffView before={props.before} after={after} />
      )}
      {change.reason && (
        <p className="text-xs text-muted-foreground text-pretty">
          {change.reason}
        </p>
      )}
      {change.needsInput && (
        <p className="flex items-start gap-1.5 text-xs text-warning-foreground">
          <WarningIcon className="mt-0.5 size-3.5 shrink-0 text-warning" />
          {t("needsInput", { question: change.needsInput })}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {decision.status === "editing" ? (
          <Button
            size="sm"
            onClick={() =>
              props.onDecide({ status: "accepted", text: decision.text })
            }
          >
            <CheckIcon /> {t("saveEdit")}
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant={decision.status === "accepted" ? "default" : "outline"}
              aria-pressed={decision.status === "accepted"}
              onClick={() =>
                props.onDecide({ status: "accepted", text: change.after })
              }
            >
              <CheckIcon /> {t("accept")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              aria-pressed={decision.status === "rejected"}
              onClick={() => props.onDecide({ status: "rejected" })}
            >
              <XIcon /> {t("reject")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => props.onDecide({ status: "editing", text: after })}
            >
              <PencilSimpleIcon /> {t("edit")}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
