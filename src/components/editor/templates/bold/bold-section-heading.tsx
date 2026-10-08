interface BoldSectionHeadingProps {
  title: string;
}

export function BoldSectionHeading(props: BoldSectionHeadingProps) {
  return (
    <div className="border-t-4 border-(--resume-accent) pt-1">
      <h2 className="resume-title-sm font-extrabold uppercase tracking-wide">
        {props.title}
      </h2>
    </div>
  );
}
