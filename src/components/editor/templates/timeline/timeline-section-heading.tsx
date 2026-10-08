interface TimelineSectionHeadingProps {
  title: string;
}

export function TimelineSectionHeading(props: TimelineSectionHeadingProps) {
  return (
    <h2 className="border-b-2 border-(--resume-accent-soft) pb-1 resume-title-sm font-bold uppercase tracking-wide text-(--resume-accent)">
      {props.title}
    </h2>
  );
}
