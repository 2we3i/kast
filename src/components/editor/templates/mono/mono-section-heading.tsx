interface MonoSectionHeadingProps {
  title: string;
}

export function MonoSectionHeading(props: MonoSectionHeadingProps) {
  return (
    <h2 className="border-b border-dashed border-muted-foreground/50 pb-1 font-mono resume-title-xs font-bold uppercase text-(--resume-accent)">
      {props.title}
    </h2>
  );
}
