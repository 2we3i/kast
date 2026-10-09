import { A, O, S } from "@mobily/ts-belt";
import { useTranslations } from "use-intl";
import { useResumeStore } from "@/lib/store";

/**
 * A readable name for an AI field path: the section, the entry's title, and
 * the field, e.g. "Experience · Senior Engineer · Description".
 */
export function useFieldLabel() {
  const open = useResumeStore((state) => state.open);
  const tSections = useTranslations("editor.generic.titles");
  const tFields = useTranslations("ai.fields");

  return (path: string): string => {
    const [sectionId, entryId, key] = S.split(path, "/");
    if (sectionId === "header") return tFields("jobTitle");
    const section = A.find(open?.sections ?? [], (s) => s.id === sectionId);
    if (O.isNone(section)) return path;
    const entry = A.find(section.entries, (e) => e.id === entryId);
    const title = O.mapWithDefault(entry, "", (value) => {
      const field =
        value.fields.title ??
        value.fields.role ??
        value.fields.degree ??
        value.fields.name;
      return field?.kind === "plain" ? S.trim(field.value) : "";
    });
    const sectionName =
      section.type === "custom"
        ? section.title
        : tSections.has(section.type)
          ? tSections(section.type)
          : section.type;
    const fieldName = tFields.has(key ?? "") ? tFields(key ?? "") : (key ?? "");
    return A.join(A.reject([sectionName, title, fieldName], S.isEmpty), " · ");
  };
}
