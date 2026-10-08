import type { ReactNode } from "react";
import { useResumeMode } from "../../resume-mode";

interface TimelineRailProps {
  dates: string;
  /** The entry's title line, which in ATS mode carries the dates on its right. */
  title: ReactNode;
  children: ReactNode;
}

/**
 * Design mode sets dates in a left column beside an accent rail. ATS mode
 * keeps one column: the dates move to the right of the title line.
 */
export function TimelineRail(props: TimelineRailProps) {
  const { atsMode } = useResumeMode();
  if (atsMode) {
    return (
      <article>
        <div className="flex items-baseline justify-between gap-4">
          {props.title}
          <span className="shrink-0 resume-body-xs text-muted-foreground">
            {props.dates}
          </span>
        </div>
        {props.children}
      </article>
    );
  }
  return (
    <article className="grid grid-cols-[6.5rem_1fr] gap-4">
      <p className="pt-px resume-body-xs font-medium text-muted-foreground">
        {props.dates}
      </p>
      <div className="border-l-2 border-(--resume-accent-soft) pl-4">
        {props.title}
        {props.children}
      </div>
    </article>
  );
}
