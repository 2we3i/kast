import { A, D, G, pipe, S } from "@mobily/ts-belt";
import type { Field, Resume } from "@/lib/resume/types";

/**
 * Personal details replaced by placeholders before anything is sent to an AI
 * provider, and put back into the answer afterwards. The user sees exactly
 * what leaves the browser and can switch each kind off.
 */
export interface MaskOptions {
  name: boolean;
  email: boolean;
  phone: boolean;
  address: boolean;
  links: boolean;
}

export const DEFAULT_MASK_OPTIONS: MaskOptions = {
  name: false,
  email: true,
  phone: true,
  address: true,
  links: true,
};

export interface MaskEntry {
  placeholder: string;
  value: string;
}

export type MaskMap = ReadonlyArray<MaskEntry>;

const EMAIL = /[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/gu;
const PHONE = /\+?\d[\d ()./-]{6,}\d/g;
const URL_PATTERN = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/giu;

function plain(field: Field | undefined): string {
  return field?.kind === "plain" ? S.trim(field.value) : "";
}

function allPlainValues(resume: Resume, key: string): ReadonlyArray<string> {
  return pipe(
    resume.sections,
    A.flatMap((section) => section.entries),
    A.map((entry) => plain(entry.fields[key])),
    A.reject(S.isEmpty),
  );
}

function numbered(
  label: string,
  values: ReadonlyArray<string>,
): ReadonlyArray<MaskEntry> {
  return A.mapWithIndex(A.uniq(values), (index, value) => ({
    placeholder: `[[${label}_${index + 1}]]`,
    value,
  }));
}

function matches(text: string, pattern: RegExp): ReadonlyArray<string> {
  return Array.from(text.matchAll(pattern), (match) => S.trim(match[0]));
}

/**
 * The mask for a résumé: its own contact details, plus any address, phone,
 * or link found inside the free text that will be sent (`text`).
 */
export function buildMask(
  resume: Resume,
  options: MaskOptions,
  text: string,
): MaskMap {
  const fields = resume.header.fields;
  const first = plain(fields.firstName);
  const last = plain(fields.lastName);
  const name = A.join(A.reject([first, last], S.isEmpty), " ");
  const entries: ReadonlyArray<ReadonlyArray<MaskEntry>> = [
    options.name
      ? A.reject(
          [
            { placeholder: "[[FULL_NAME]]", value: name },
            { placeholder: "[[FIRST_NAME]]", value: first },
            { placeholder: "[[LAST_NAME]]", value: last },
          ],
          (entry) => S.length(entry.value) < 2,
        )
      : [],
    options.email
      ? numbered("EMAIL", [
          plain(fields.email),
          ...allPlainValues(resume, "email"),
          ...matches(text, EMAIL),
        ])
      : [],
    options.phone
      ? numbered("PHONE", [
          plain(fields.phone),
          ...allPlainValues(resume, "phone"),
          ...matches(text, PHONE),
        ])
      : [],
    options.address
      ? A.reject(
          [
            { placeholder: "[[CITY]]", value: plain(fields.city) },
            { placeholder: "[[REGION]]", value: plain(fields.province) },
            { placeholder: "[[BIRTH_DATE]]", value: plain(fields.birthDate) },
          ],
          (entry) => S.isEmpty(entry.value),
        )
      : [],
    options.links
      ? numbered("LINK", [
          plain(fields.website),
          plain(fields.linkedin),
          plain(fields.link),
          ...matches(text, URL_PATTERN),
        ])
      : [],
  ];
  return pipe(
    A.flat(entries),
    A.reject((entry) => S.isEmpty(entry.value)),
    // Longest first, so "John Doe" is masked before "John".
    A.sort((a, b) => S.length(b.value) - S.length(a.value)),
  );
}

function escapeRegExp(value: string): string {
  return S.replaceByRe(value, /[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function maskText(text: string, mask: MaskMap): string {
  return A.reduce(mask, text, (acc, entry) =>
    S.replaceByRe(
      acc,
      new RegExp(escapeRegExp(entry.value), "giu"),
      entry.placeholder,
    ),
  );
}

export function unmaskText(text: string, mask: MaskMap): string {
  return A.reduce(mask, text, (acc, entry) =>
    S.replaceAll(acc, entry.placeholder, entry.value),
  );
}

/** Puts the hidden details back into every string of an answer. */
export function unmaskDeep<T>(value: T, mask: MaskMap): T {
  if (G.isString(value)) return unmaskText(value, mask) as T;
  if (G.isArray(value)) {
    return A.map(value, (item) => unmaskDeep(item, mask)) as unknown as T;
  }
  if (G.isObject(value)) {
    return D.map(value as Record<string, unknown>, (item) =>
      unmaskDeep(item, mask),
    ) as T;
  }
  return value;
}
