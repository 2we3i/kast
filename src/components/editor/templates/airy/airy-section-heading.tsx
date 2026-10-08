interface AirySectionHeadingProps {
  title: string;
}

export function AirySectionHeading(props: AirySectionHeadingProps) {
  return (
    <h2 className="font-serif resume-title-xs font-semibold uppercase tracking-[0.2em] text-(--resume-accent)">
      {props.title}
    </h2>
  );
}
