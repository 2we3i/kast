import { TrashIcon } from "@phosphor-icons/react";
import { type Control, Controller } from "react-hook-form";
import { useTranslations } from "use-intl";
import { SortableItem } from "@/components/shared/sortable-list";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_SKILL_LEVELS } from "@/lib/resume/schema-fields";
import type { LanguagesFormValues } from "../resume-form-adapter-lists";

const SKILLS = ["speaking", "understanding", "writing"] as const;

const LANGUAGE_LEVELS = [
  "Native",
  "Fluent",
  "Professional",
  "Conversational",
  "Basic",
] as const;

interface EditorSectionLanguagesFormItemProps {
  id: string;
  index: number;
  showProficiency: boolean;
  control: Control<LanguagesFormValues>;
  onRemoveField: (index: number) => void;
}

export function EditorSectionLanguagesFormItem(
  props: EditorSectionLanguagesFormItemProps,
) {
  const t = useTranslations("editor.languages");
  const tl = useTranslations("editor.levels");

  return (
    <SortableItem id={props.id} handleLabel={t("reorder")} align="start">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div
            data-proficiency={props.showProficiency}
            className="flex items-center gap-2 flex-1"
          >
            <Controller
              control={props.control}
              name={`languages.${props.index}.name`}
              render={(controller) => {
                const { field, fieldState } = controller;
                return (
                  <Field className="flex-1">
                    <Input
                      placeholder={t("namePlaceholder")}
                      {...field}
                      id={field.name}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                );
              }}
            />

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="md:hidden"
              onClick={() => props.onRemoveField(props.index)}
            >
              <TrashIcon className="size-3.5 text-destructive" />
              <span className="sr-only">{t("remove")}</span>
            </Button>
          </div>

          {props.showProficiency && (
            <Controller
              control={props.control}
              name={`languages.${props.index}.level`}
              render={(controller) => {
                const { field } = controller;
                return (
                  <Select
                    value={field.value || null}
                    onValueChange={(value) => field.onChange(value)}
                  >
                    <SelectTrigger className="w-[87.888%] md:w-40">
                      <SelectValue placeholder={t("proficiency")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {LANGUAGE_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {tl.has(level) ? tl(level) : level}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                );
              }}
            />
          )}

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="max-md:hidden"
            onClick={() => props.onRemoveField(props.index)}
          >
            <TrashIcon className="size-3.5 text-destructive" />
            <span className="sr-only">{t("remove")}</span>
          </Button>
        </div>
        {props.showProficiency && (
          <div className="grid grid-cols-3 gap-2">
            {SKILLS.map((skill) => (
              <Controller
                key={skill}
                control={props.control}
                name={`languages.${props.index}.${skill}`}
                render={(controller) => {
                  const { field } = controller;
                  return (
                    <Select
                      value={field.value || null}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-full"
                        aria-label={t(skill)}
                      >
                        <SelectValue placeholder={t(skill)}>
                          {(value: string | null) =>
                            value ? `${t(skill)}: ${tl(value)}` : null
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {LANGUAGE_SKILL_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {tl(level)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  );
                }}
              />
            ))}
          </div>
        )}
      </div>
    </SortableItem>
  );
}
