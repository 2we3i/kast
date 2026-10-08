import type { LanguageItemView } from "./resume-preview";

export function ResumeLanguageItem(props: LanguageItemView) {
  return (
    <li className="resume-body-xs">
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-semibold">{props.name}</span>
        {props.proficiency && (
          <span className="text-muted-foreground">{props.proficiency}</span>
        )}
      </div>
      {props.skills && <p className="text-muted-foreground">{props.skills}</p>}
    </li>
  );
}
