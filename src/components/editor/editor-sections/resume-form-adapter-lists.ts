import { A, F, O, pipe } from "@mobily/ts-belt";
import { updateSectionById, updateSections } from "@/lib/resume";
import type { Entry, Resume } from "@/lib/resume/types";
import {
  entryId,
  plain,
  plainValue,
  sectionOfType,
} from "./resume-form-adapter-shared";

export interface SkillItemValues {
  name: string;
  level: string;
  description: string;
}

export interface SkillsFormValues {
  skills: SkillItemValues[];
}

export interface CertificationItemValues {
  name: string;
  issuer: string;
  url: string;
  date: string;
}

export interface CertificationsFormValues {
  certifications: CertificationItemValues[];
}

export interface LanguageItemValues {
  name: string;
  level: string;
  speaking: string;
  understanding: string;
  writing: string;
}

export interface LanguagesFormValues {
  languages: LanguageItemValues[];
}

// --- Skills (repeating section, one plain name per skill) -------------------

export function skillsEntries(resume: Resume): ReadonlyArray<Entry> {
  return pipe(
    sectionOfType(resume, "skills"),
    O.mapWithDefault([], (section) => section.entries),
  );
}

export function toSkillsValues(resume: Resume): SkillsFormValues {
  return {
    skills: pipe(
      skillsEntries(resume),
      A.map((entry) => ({
        name: plainValue(entry.fields.name),
        level: plainValue(entry.fields.level),
        description: plainValue(entry.fields.description),
      })),
      F.toMutable,
    ),
  };
}

export function applySkillsValues(
  resume: Resume,
  values: SkillsFormValues,
): Resume {
  const section = sectionOfType(resume, "skills");
  if (O.isNone(section)) return resume;
  const entries = pipe(
    values.skills,
    A.mapWithIndex((index, item) => ({
      id: entryId(section, index),
      fields: {
        name: plain(item.name),
        level: plain(item.level),
        description: plain(item.description),
      },
    })),
  );
  return updateSections(
    resume,
    updateSectionById(section.id, (current) => ({ ...current, entries })),
  );
}

// --- Certifications (repeating: name, issuer, url) --------------------------

export function certificationEntries(resume: Resume): ReadonlyArray<Entry> {
  return pipe(
    sectionOfType(resume, "certifications"),
    O.mapWithDefault([], (section) => section.entries),
  );
}

export function toCertificationsValues(
  resume: Resume,
): CertificationsFormValues {
  return {
    certifications: pipe(
      certificationEntries(resume),
      A.map((entry) => ({
        name: plainValue(entry.fields.name),
        issuer: plainValue(entry.fields.issuer),
        url: plainValue(entry.fields.url),
        date: plainValue(entry.fields.date),
      })),
      F.toMutable,
    ),
  };
}

export function applyCertificationsValues(
  resume: Resume,
  values: CertificationsFormValues,
): Resume {
  const section = sectionOfType(resume, "certifications");
  if (O.isNone(section)) return resume;
  const entries = pipe(
    values.certifications,
    A.mapWithIndex((index, item) => ({
      id: entryId(section, index),
      fields: {
        name: plain(item.name),
        issuer: plain(item.issuer),
        url: plain(item.url),
        date: plain(item.date),
      },
    })),
  );
  return updateSections(
    resume,
    updateSectionById(section.id, (current) => ({ ...current, entries })),
  );
}

// --- Languages (repeating: name + proficiency level) -----------------------

export function languageEntries(resume: Resume): ReadonlyArray<Entry> {
  return pipe(
    sectionOfType(resume, "languages"),
    O.mapWithDefault([], (section) => section.entries),
  );
}

export function toLanguagesValues(resume: Resume): LanguagesFormValues {
  return {
    languages: pipe(
      languageEntries(resume),
      A.map((entry) => ({
        name: plainValue(entry.fields.name),
        level: plainValue(entry.fields.level),
        speaking: plainValue(entry.fields.speaking),
        understanding: plainValue(entry.fields.understanding),
        writing: plainValue(entry.fields.writing),
      })),
      F.toMutable,
    ),
  };
}

export function applyLanguagesValues(
  resume: Resume,
  values: LanguagesFormValues,
): Resume {
  const section = sectionOfType(resume, "languages");
  if (O.isNone(section)) return resume;
  const entries = pipe(
    values.languages,
    A.mapWithIndex((index, item) => ({
      id: entryId(section, index),
      fields: {
        name: plain(item.name),
        level: plain(item.level),
        speaking: plain(item.speaking),
        understanding: plain(item.understanding),
        writing: plain(item.writing),
      },
    })),
  );
  return updateSections(
    resume,
    updateSectionById(section.id, (current) => ({ ...current, entries })),
  );
}
