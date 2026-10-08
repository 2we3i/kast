interface CompactSectionHeadingProps {
  title: string;
}

export function CompactSectionHeading(props: CompactSectionHeadingProps) {
  return (
    <div className="border-y border-(--resume-accent) py-1.5">
      <h2 className="text-center font-serif resume-title-base tracking-wide text-(--resume-accent)">
        {props.title}
      </h2>
    </div>
  );
}
