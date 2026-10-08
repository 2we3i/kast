import { A, D, G } from "@mobily/ts-belt";
import { plainField, type ResumeDoc } from "./migrations-shared";

/** Template ids of the previous product, mapped to the Kast catalog. */
export const LEGACY_TEMPLATE_IDS: Record<string, string> = {
  awal: "standard",
  ketat: "compact",
  luasa: "airy",
  tebal: "bold",
  klasik: "classic",
  ketik: "mono",
};

const SUPPORTED_LANGUAGES = ["en", "lt", "ru"];

/** Field keys each section type gains at v25, all stamped empty. */
const NEW_ENTRY_FIELDS: Record<string, ReadonlyArray<string>> = {
  skills: ["description"],
  languages: ["speaking", "understanding", "writing"],
  certifications: ["date"],
};

function withEmptyFields(entry: unknown, keys: ReadonlyArray<string>): unknown {
  if (!G.isObject(entry)) return entry;
  const record = entry as Record<string, unknown>;
  if (!G.isObject(record.fields)) return entry;
  const fields = record.fields as Record<string, unknown>;
  const missing = A.reject(keys, (key) => key in fields);
  if (A.isEmpty(missing)) return entry;
  const added = A.reduce(missing, fields, (acc, key) =>
    D.set(acc, key, plainField("")),
  );
  return { ...record, fields: added };
}

function withNewEntryFields(section: unknown): unknown {
  if (!G.isObject(section)) return section;
  const record = section as Record<string, unknown>;
  const keys = G.isString(record.type) ? NEW_ENTRY_FIELDS[record.type] : null;
  if (!keys || !Array.isArray(record.entries)) return section;
  return {
    ...record,
    entries: A.map(record.entries as unknown[], (entry) =>
      withEmptyFields(entry, keys),
    ),
  };
}

function withBirthDate(header: unknown): unknown {
  if (!G.isObject(header)) return header;
  const record = header as { fields?: unknown };
  if (!G.isObject(record.fields)) return header;
  const fields = record.fields as Record<string, unknown>;
  if ("birthDate" in fields) return header;
  return { ...record, fields: { ...fields, birthDate: plainField("") } };
}

/**
 * Documents written before the two presentation modes keep their look: one
 * that drew a photo or contact icons lands in design mode; the rest are
 * already ATS-safe.
 */
function legacyAtsMode(doc: ResumeDoc): boolean {
  const header = doc.header as { photo?: unknown } | undefined;
  const hasPhoto = G.isString(header?.photo) && header.photo !== "";
  return !hasPhoto && doc.showIcons === false;
}

/**
 * v24→v25 (Kast): résumé languages become en/lt/ru (anything else reads as
 * English); the old template ids map onto the renamed catalog; skills gain a
 * description, languages the three CEFR skills, certificates a date, and the
 * header a date-of-birth line, all stamped empty so nothing renders until
 * filled; the ATS/design mode is stamped from what the document drew.
 * Bail-safe: values already present are kept, malformed parts are skipped.
 */
export function migrateV24toV25(doc: ResumeDoc): ResumeDoc {
  const next = structuredClone(doc);
  const language = A.includes(SUPPORTED_LANGUAGES, next.language as string)
    ? next.language
    : "en";
  const templateId = G.isString(next.templateId)
    ? (LEGACY_TEMPLATE_IDS[next.templateId] ?? next.templateId)
    : next.templateId;
  const sections = Array.isArray(next.sections)
    ? A.map(next.sections as unknown[], withNewEntryFields)
    : next.sections;
  const atsMode = G.isBoolean(next.atsMode)
    ? next.atsMode
    : legacyAtsMode(next);
  // Courier Prime has no Cyrillic or Lithuanian letters; Cousine replaces it.
  const font = next.font === "courier-prime" ? "cousine" : next.font;
  return {
    ...next,
    font,
    language,
    templateId,
    atsMode,
    header: withBirthDate(next.header),
    sections,
  };
}
