import { useResumeMode } from "../../resume-mode";

interface ModernSectionHeadingProps {
  title: string;
}

export function ModernSectionHeading(props: ModernSectionHeadingProps) {
  const { atsMode } = useResumeMode();
  return (
    <div className="flex items-center gap-2">
      {!atsMode && (
        <span className="size-2 shrink-0 rounded-sm bg-(--resume-accent)" />
      )}
      <h2 className="resume-title-sm font-bold uppercase tracking-wide text-(--resume-accent)">
        {props.title}
      </h2>
      <span className="h-px flex-1 bg-(--resume-accent-soft)" />
    </div>
  );
}
