import { A, D, pipe, S } from "@mobily/ts-belt";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { type ImportDraft, REVIEW_THRESHOLD } from "@/lib/import";
import type { Field, Resume } from "@/lib/resume/types";
import { cn } from "@/lib/utils";

interface ReviewField {
  key: string;
  group: string;
  label: string;
  value: string;
  confidence: number;
}

function plainValue(field: Field | undefined): string {
  return field?.kind === "plain" ? field.value : "";
}

/** Every plain field the import filled or scored, by section and entry. */
function reviewFields(
  resume: Resume,
  confidence: ImportDraft["confidence"],
  sectionName: (type: string, title: string) => string,
): ReadonlyArray<ReviewField> {
  const header = pipe(
    D.toPairs(resume.header.fields),
    A.filter(
      ([key, field]) =>
        field.kind === "plain" &&
        (S.isNotEmpty(field.value) || `header/${key}` in confidence),
    ),
    A.map(([key, field]) => ({
      key: `header/${key}`,
      group: "header",
      label: key,
      value: plainValue(field),
      confidence: confidence[`header/${key}`] ?? 1,
    })),
  );
  const entries = A.flatMap(resume.sections, (section) =>
    A.flatMap(section.entries, (entry) =>
      pipe(
        D.toPairs(entry.fields),
        A.filter(
          ([key, field]) =>
            field.kind === "plain" && `${entry.id}/${key}` in confidence,
        ),
        A.map(([key, field]) => ({
          key: `${entry.id}/${key}`,
          group: sectionName(section.type, section.title),
          label: key,
          value: plainValue(field),
          confidence: confidence[`${entry.id}/${key}`] ?? 1,
        })),
      ),
    ),
  );
  return A.concat(header, entries);
}

interface ImportReviewFieldsProps {
  draft: ImportDraft;
  resume: Resume;
  onChange: (key: string, value: string) => void;
  onlyUncertain: boolean;
}

/**
 * The parsed fields, editable in place. Fields the parser was unsure of are
 * marked and listed first, so a person checks exactly what needs checking.
 */
export function ImportReviewFields(props: ImportReviewFieldsProps) {
  const t = useTranslations("import.review");
  const tSections = useTranslations("editor.generic.titles");
  const tFields = useTranslations("import.fields");
  const fields = reviewFields(
    props.resume,
    props.draft.confidence,
    (type, title) =>
      type === "custom" ? title : tSections.has(type) ? tSections(type) : type,
  );
  const shown = props.onlyUncertain
    ? A.filter(fields, (field) => field.confidence < REVIEW_THRESHOLD)
    : fields;
  const groups = pipe(
    shown,
    A.groupBy((field) => field.group),
    D.toPairs,
  );

  if (A.isEmpty(shown)) {
    return (
      <p className="text-sm text-muted-foreground">{t("nothingUncertain")}</p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map(([group, items]) => (
        <fieldset key={group} className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">
            {group === "header" ? t("headerGroup") : group}
          </legend>
          {(items ?? []).map((field) => {
            const uncertain = field.confidence < REVIEW_THRESHOLD;
            const id = `review-${field.key}`;
            return (
              <div
                key={field.key}
                className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:items-center"
              >
                <label
                  htmlFor={id}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  {uncertain && (
                    <WarningCircleIcon
                      weight="fill"
                      className="size-3.5 text-warning"
                    />
                  )}
                  {tFields.has(field.label)
                    ? tFields(field.label)
                    : field.label}
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    id={id}
                    value={field.value}
                    aria-invalid={uncertain}
                    aria-describedby={`${id}-confidence`}
                    className={cn(
                      "h-8",
                      uncertain && "border-warning bg-warning/10",
                    )}
                    onChange={(event) =>
                      props.onChange(field.key, event.target.value)
                    }
                  />
                  <Badge
                    id={`${id}-confidence`}
                    variant={uncertain ? "outline" : "secondary"}
                    className="shrink-0 tabular-nums"
                    title={t("confidenceTitle")}
                  >
                    {Math.round(field.confidence * 100)}%
                  </Badge>
                </div>
              </div>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}

/** How many fields fall under the review threshold. */
export function countUncertain(draft: ImportDraft): number {
  return A.length(
    A.filter(D.values(draft.confidence), (value) => value < REVIEW_THRESHOLD),
  );
}

/** Writes one edited plain field back into the draft résumé. */
export function setDraftField(
  resume: Resume,
  key: string,
  value: string,
): Resume {
  const [owner, field] = S.split(key, "/");
  if (!owner || !field) return resume;
  if (owner === "header") {
    return {
      ...resume,
      header: {
        ...resume.header,
        fields: { ...resume.header.fields, [field]: { kind: "plain", value } },
      },
    };
  }
  return {
    ...resume,
    sections: A.map(resume.sections, (section) => ({
      ...section,
      entries: A.map(section.entries, (entry) =>
        entry.id === owner
          ? {
              ...entry,
              fields: { ...entry.fields, [field]: { kind: "plain", value } },
            }
          : entry,
      ),
    })),
  };
}
