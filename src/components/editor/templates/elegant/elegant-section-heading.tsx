interface ElegantSectionHeadingProps {
  title: string;
}

export function ElegantSectionHeading(props: ElegantSectionHeadingProps) {
  return (
    <div className="flex items-center gap-3 font-serif">
      <span className="h-px flex-1 bg-(--resume-accent)" />
      <h2 className="resume-title-sm uppercase tracking-[0.18em] text-(--resume-accent)">
        {props.title}
      </h2>
      <span className="h-px flex-1 bg-(--resume-accent)" />
    </div>
  );
}
