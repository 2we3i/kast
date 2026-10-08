import { useResumeMode } from "../../resume-mode";

interface ExecutiveSectionHeadingProps {
  title: string;
}

/** Design mode sets the heading on an accent chip; ATS mode underlines it. */
export function ExecutiveSectionHeading(props: ExecutiveSectionHeadingProps) {
  const { atsMode } = useResumeMode();
  if (atsMode) {
    return (
      <h2 className="border-b border-foreground pb-0.5 resume-title-xs font-bold uppercase tracking-wide">
        {props.title}
      </h2>
    );
  }
  return (
    <div className="flex">
      <h2 className="rounded-sm bg-(--resume-accent) px-2 py-0.5 resume-title-xs font-bold uppercase tracking-wide text-white">
        {props.title}
      </h2>
    </div>
  );
}
