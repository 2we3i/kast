import { A } from "@mobily/ts-belt";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { Badge } from "@/components/ui/badge";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import type { KeywordReport } from "@/lib/ats/types";
import { useResumeStore } from "@/lib/store";
import { EMPTY_TARGET } from "../editor-toolbar/editor-target-dialog";

interface AtsKeywordsProps {
  report: KeywordReport | null;
}

/**
 * The vacancy text box and what it found. The text is the same one the job
 * target holds, so pasting it here also tailors the AI and the target badge.
 */
export function AtsKeywords(props: AtsKeywordsProps) {
  const description = useResumeStore(
    (state) => state.open?.target?.description ?? "",
  );
  const updateOpen = useResumeStore((state) => state.updateOpen);
  const t = useTranslations("ats.keywords");

  function onChange(value: string) {
    updateOpen((resume) => ({
      ...resume,
      target: { ...EMPTY_TARGET, ...resume.target, description: value },
    }));
  }

  return (
    <div className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="ats-vacancy">{t("label")}</FieldLabel>
        <Textarea
          id="ats-vacancy"
          rows={5}
          value={description}
          placeholder={t("placeholder")}
          onChange={(event) => onChange(event.target.value)}
        />
        <FieldDescription>{t("hint")}</FieldDescription>
      </Field>
      {props.report && (
        <div className="flex flex-col gap-3">
          <KeywordGroup
            title={t("found", { count: A.length(props.report.found) })}
            terms={props.report.found}
            found
          />
          <KeywordGroup
            title={t("missing", { count: A.length(props.report.missing) })}
            terms={props.report.missing}
            found={false}
          />
          {A.isNotEmpty(props.report.missing) && (
            <p className="text-xs text-muted-foreground text-pretty">
              {t("honesty")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface KeywordGroupProps {
  title: string;
  terms: ReadonlyArray<string>;
  found: boolean;
}

function KeywordGroup(props: KeywordGroupProps) {
  if (A.isEmpty(props.terms)) return null;
  const Icon = props.found ? CheckIcon : XIcon;
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">
        {props.title}
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {props.terms.map((term) => (
          <li key={term}>
            <Badge variant={props.found ? "secondary" : "outline"}>
              <Icon /> {term}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
