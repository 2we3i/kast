import type { SkillItemView } from "./resume-preview";

export function ResumeSkillItem(props: SkillItemView) {
  return (
    <li className="resume-body-xs">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-semibold">{props.name}</span>
        {props.proficiency && (
          <span className="text-muted-foreground">{props.proficiency}</span>
        )}
      </div>
      {props.description && (
        <p className="text-muted-foreground">{props.description}</p>
      )}
    </li>
  );
}
