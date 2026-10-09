import { A, O } from "@mobily/ts-belt";
import { PlusIcon } from "@phosphor-icons/react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslations } from "use-intl";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { FieldSet } from "@/components/ui/field";
import { getSectionSchema } from "@/lib/resume/schema-registry";
import { useResumeStore } from "@/lib/store";
import { SECTION_ICONS } from "../section-icons";
import { GenericEntry } from "./generic-entry";
import {
  applyGenericValues,
  emptyGenericEntry,
  type GenericFormValues,
  toGenericValues,
} from "./generic-form-adapter";

interface GenericFormProps {
  sectionId: string;
}

/**
 * The form for an optional section, driven by its registry schema. Like every
 * section form it owns its values: edits flow into the store, and an undo
 * remounts it through the list's key.
 */
export function GenericForm(props: GenericFormProps) {
  const section = useResumeStore((state) =>
    A.find(state.open?.sections ?? [], (s) => s.id === props.sectionId),
  );
  const updateOpen = useResumeStore((state) => state.updateOpen);
  const t = useTranslations("editor.generic");

  const form = useForm<GenericFormValues>({
    defaultValues: O.mapWithDefault(section, { entries: [] }, toGenericValues),
  });
  const { fields, prepend, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  });

  useEffect(() => {
    const subscription = form.watch(() => {
      updateOpen(applyGenericValues(props.sectionId, form.getValues()));
    });
    return () => subscription.unsubscribe();
  }, [form, updateOpen, props.sectionId]);

  if (O.isNone(section)) return null;
  const type = section.type;
  const singleton = getSectionSchema(type).singleton;

  if (singleton) {
    return (
      <form>
        <GenericEntry control={form.control} index={0} sectionType={type} />
      </form>
    );
  }

  return (
    <form>
      <FieldSet className="gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => prepend(emptyGenericEntry(type))}
        >
          <PlusIcon /> {t(`add.${type}`)}
        </Button>
        {fields.length === 0 && (
          <EmptyState
            icon={SECTION_ICONS[type]}
            title={t("emptyTitle")}
            description={t(`empty.${type}`)}
          />
        )}
        {fields.map((field, index) => (
          <GenericEntry
            key={field.id}
            control={form.control}
            index={index}
            sectionType={type}
            onRemove={() => remove(index)}
          />
        ))}
      </FieldSet>
    </form>
  );
}
