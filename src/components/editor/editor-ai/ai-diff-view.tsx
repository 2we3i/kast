import { useMemo } from "react";
import { diffWords } from "@/lib/ai/diff";
import { cn } from "@/lib/utils";

interface AiDiffViewProps {
  before: string;
  after: string;
}

/** Word-level before/after: removed words struck through, added underlined. */
export function AiDiffView(props: AiDiffViewProps) {
  const parts = useMemo(
    () => diffWords(props.before, props.after),
    [props.before, props.after],
  );
  return (
    <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-2 text-xs leading-relaxed">
      {parts.map((part, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: diff parts are positional and re-derived together
          key={index}
          className={cn(
            part.kind === "removed" &&
              "bg-destructive/10 text-destructive line-through",
            part.kind === "added" &&
              "bg-success/15 text-success underline decoration-success",
          )}
        >
          {part.kind === "removed" && <span className="sr-only">−</span>}
          {part.kind === "added" && <span className="sr-only">+</span>}
          {part.text}
        </span>
      ))}
    </p>
  );
}
