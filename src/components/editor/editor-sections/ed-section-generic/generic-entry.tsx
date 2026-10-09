import { A } from "@mobily/ts-belt";
import { TrashIcon } from "@phosphor-icons/react";
import type { Control } from "react-hook-form";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { getSectionSchema } from "@/lib/resume/schema-registry";
import type { SectionType } from "@/lib/resume/types";
import { cn } from "@/lib/utils";
import { DateRangeFields } from "../date-range-fields";
import { GenericField } from "./generic-field";
import type { GenericFormValues } from "./generic-form-adapter";

interface GenericEntryProps {
  control: Control<GenericFormValues>;
  index: number;
  sectionType: SectionType;
  /** Absent for a singleton section, whose one entry cannot be removed. */
  onRemove?: () => void;
  onDatesCommit?: () => void;
}

/**
 * Every field of one entry, in registry order. A start/end date pair is drawn
 * as the shared range picker with its "ongoing" checkbox.
 */
export function GenericEntry(props: GenericEntryProps) {
  const t = useTranslations("editor.generic");
  const fields = getSectionSchema(props.sectionType).fields;
  const hasRange =
    A.some(fields, (field) => field.key === "startDate") &&
    A.some(fields, (field) => field.key === "endDate");
  const shown = A.reject(
    fields,
    (field) =>
      hasRange && (field.key === "startDate" || field.key === "endDate"),
  );
  // The first plain field leads the entry with its remove button; the other
  // plain fields share a two-column grid; rich fields follow full width.
  const [lead, ...short] = A.filter(shown, (field) => field.kind === "plain");
  const rich = A.filter(shown, (field) => field.kind === "richtext");

  return (
    <FieldSet className={cn(props.onRemove && "rounded-lg border p-3")}>
      <FieldLegend className="sr-only" variant="label">
        {t("entryLegend", { index: props.index + 1 })}
      </FieldLegend>
      <FieldGroup className="gap-3">
        {lead && (
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <GenericField
                control={props.control}
                index={props.index}
                sectionType={props.sectionType}
                schema={lead}
              />
            </div>
            {props.onRemove && (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={props.onRemove}
              >
                <TrashIcon className="size-3.5 text-destructive" />
                <span className="sr-only">{t("remove")}</span>
              </Button>
            )}
          </div>
        )}
        {A.isNotEmpty(short) && (
          <div className="grid gap-3 sm:grid-cols-2">
            {short.map((schema) => (
              <GenericField
                key={schema.key}
                control={props.control}
                index={props.index}
                sectionType={props.sectionType}
                schema={schema}
              />
            ))}
          </div>
        )}
        {hasRange && (
          <DateRangeFields
            control={props.control}
            startName={`entries.${props.index}.startDate`}
            endName={`entries.${props.index}.endDate`}
            presentLabel={t("ongoing")}
            onCommit={props.onDatesCommit}
          />
        )}
        {rich.map((schema) => (
          <GenericField
            key={schema.key}
            control={props.control}
            index={props.index}
            sectionType={props.sectionType}
            schema={schema}
          />
        ))}
      </FieldGroup>
    </FieldSet>
  );
}
