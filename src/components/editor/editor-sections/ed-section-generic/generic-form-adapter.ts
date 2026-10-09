import { A, D, F, O, pipe } from "@mobily/ts-belt";
import type { JSONContent } from "@tiptap/core";
import { emptyRichTextValue } from "@/lib/resume/factory";
import type { FieldSchema } from "@/lib/resume/schema-fields";
import { getSectionSchema } from "@/lib/resume/schema-registry";
import type {
  Entry,
  Field,
  Resume,
  Section,
  SectionType,
} from "@/lib/resume/types";
import { updateSectionById, updateSections } from "@/lib/resume/update";
import {
  entryId,
  plain,
  plainValue,
  rich,
  richValue,
  sectionById,
} from "../resume-form-adapter-shared";

/**
 * One entry's form values, keyed by the registry's field keys: strings for
 * plain fields, ProseMirror JSON for rich ones. The registry drives the shape,
 * so every optional section shares this one adapter.
 */
export type GenericEntryValues = Record<string, string | JSONContent>;

export interface GenericFormValues {
  entries: GenericEntryValues[];
}

function fieldsOf(type: SectionType): ReadonlyArray<FieldSchema> {
  return getSectionSchema(type).fields;
}

function fieldValueOf(schema: FieldSchema, field: Field | undefined) {
  if (schema.kind === "plain") return plainValue(field);
  return richValue(field);
}

function entryToValues(
  entry: Entry,
  fields: ReadonlyArray<FieldSchema>,
): GenericEntryValues {
  return pipe(
    fields,
    A.map((schema): readonly [string, string | JSONContent] => [
      schema.key,
      fieldValueOf(schema, entry.fields[schema.key]),
    ]),
    D.fromPairs,
  );
}

export function emptyGenericEntry(type: SectionType): GenericEntryValues {
  return pipe(
    fieldsOf(type),
    A.map((schema): readonly [string, string | JSONContent] => [
      schema.key,
      schema.kind === "plain" ? "" : emptyRichTextValue(),
    ]),
    D.fromPairs,
  );
}

/**
 * The form's starting values. A singleton section starts with one empty entry
 * in the form, but the document keeps none until the first edit, so an
 * untouched section stays out of the résumé.
 */
export function toGenericValues(section: Section): GenericFormValues {
  const schema = getSectionSchema(section.type);
  const entries = A.map(section.entries, (entry) =>
    entryToValues(entry, schema.fields),
  );
  if (schema.singleton && A.isEmpty(entries)) {
    return { entries: [emptyGenericEntry(section.type)] };
  }
  return { entries: F.toMutable(entries) };
}

function valuesToField(
  schema: FieldSchema,
  value: string | JSONContent | undefined,
): Field {
  if (schema.kind === "plain") {
    return plain(typeof value === "string" ? value : "");
  }
  if (value && typeof value === "object") return rich(value);
  return rich(emptyRichTextValue());
}

/** Data-last: pass the result straight to `updateOpen`. */
export function applyGenericValues(
  id: string,
  values: GenericFormValues,
): (resume: Resume) => Resume {
  return (resume) => {
    const section = sectionById(resume, id);
    if (O.isNone(section)) return resume;
    const fields = fieldsOf(section.type);
    const entries = A.mapWithIndex(values.entries, (index, item) => ({
      id: entryId(section, index),
      fields: pipe(
        fields,
        A.map((schema): readonly [string, Field] => [
          schema.key,
          valuesToField(schema, item[schema.key]),
        ]),
        D.fromPairs,
      ),
    }));
    return updateSections(
      resume,
      updateSectionById(section.id, (current) => ({ ...current, entries })),
    );
  };
}
