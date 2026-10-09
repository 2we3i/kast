import { type Control, Controller } from "react-hook-form";
import { useTranslations } from "use-intl";
import { UrlInput } from "@/components/shared/url-input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldSchema } from "@/lib/resume/schema-fields";
import type { SectionType } from "@/lib/resume/types";
import { MonthYearMenu } from "../../month-year-menu/month-year-menu";
import { RichTextEditor } from "../../rich-text/rich-text-editor";
import type { GenericFormValues } from "./generic-form-adapter";

interface GenericFieldProps {
  control: Control<GenericFormValues>;
  index: number;
  sectionType: SectionType;
  schema: FieldSchema;
}

const INPUT_TYPES: Partial<Record<string, string>> = {
  email: "email",
  phone: "tel",
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** One registry field drawn as the input its schema asks for. */
export function GenericField(props: GenericFieldProps) {
  const { schema, sectionType } = props;
  const t = useTranslations("editor.generic");
  const labelKey = `fields.${sectionType}.${schema.key}`;
  const placeholderKey = `${labelKey}Placeholder`;
  const placeholder = t.has(placeholderKey) ? t(placeholderKey) : undefined;
  const name = `entries.${props.index}.${schema.key}` as const;

  return (
    <Controller
      control={props.control}
      name={name}
      render={(controller) => {
        const { field } = controller;
        const id = field.name;
        if (schema.kind === "richtext") {
          return (
            <Field>
              <FieldLabel htmlFor={id}>{t(labelKey)}</FieldLabel>
              <RichTextEditor
                id={id}
                value={
                  typeof field.value === "object" ? field.value : undefined
                }
                features={schema.features}
                placeholder={placeholder}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            </Field>
          );
        }
        return (
          <Field>
            <FieldLabel htmlFor={id}>{t(labelKey)}</FieldLabel>
            <PlainInput
              id={id}
              schema={schema}
              value={asText(field.value)}
              placeholder={placeholder}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          </Field>
        );
      }}
    />
  );
}

interface PlainInputProps {
  id: string;
  schema: FieldSchema;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function PlainInput(props: PlainInputProps) {
  const t = useTranslations("editor.generic");
  const input = props.schema.kind === "plain" ? props.schema.input : undefined;
  if (input === "date") {
    return (
      <MonthYearMenu
        id={props.id}
        value={props.value}
        placeholder={t("datePlaceholder")}
        onChange={props.onChange}
      />
    );
  }
  if (input === "url") {
    return (
      <UrlInput
        id={props.id}
        value={props.value}
        placeholder={props.placeholder}
        onChange={props.onChange}
        onBlur={props.onBlur}
      />
    );
  }
  if (input === "select" && props.schema.kind === "plain") {
    return (
      <Select
        value={props.value || null}
        onValueChange={(value) => props.onChange(value ?? "")}
      >
        <SelectTrigger id={props.id} className="w-full">
          <SelectValue placeholder={t("selectPlaceholder")}>
            {(value: string | null) => (value ? t(`options.${value}`) : null)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {(props.schema.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {t(`options.${option}`)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }
  return (
    <Input
      id={props.id}
      type={INPUT_TYPES[input ?? "text"] ?? "text"}
      value={props.value}
      placeholder={props.placeholder}
      onChange={(event) => props.onChange(event.target.value)}
      onBlur={props.onBlur}
    />
  );
}
