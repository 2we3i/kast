interface ClassicSectionHeadingProps {
  title: string;
}

export function ClassicSectionHeading(props: ClassicSectionHeadingProps) {
  return (
    <div className="border-b border-(--resume-accent) pb-1">
      <h2 className="text-center font-serif resume-title-sm uppercase">
        {props.title}
      </h2>
    </div>
  );
}
