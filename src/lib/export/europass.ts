import { A, D, G, O, pipe, S } from "@mobily/ts-belt";
import {
  type InlineRun,
  type RichBlock,
  tiptapToRichBlocks,
} from "@/lib/resume/rich-content";
import type { Entry, Field, Resume, Section } from "@/lib/resume/types";
import { countryCode, languageCode } from "./europass-codes";

/**
 * Europass CV export in the SkillsPassport v3.4 format (the format the
 * Europass portal imports as a "Europass CV" file), as its JSON object; the
 * XML serialization lives in europass-xml.ts and reads this same object.
 */

export interface EuropassDate {
  Year: number;
  Month?: number;
}

export interface EuropassPeriod {
  From?: EuropassDate;
  To?: EuropassDate;
  Current?: boolean;
}

export interface EuropassLabel {
  Code?: string;
  Label: string;
}

export interface EuropassContactInfo {
  Address?: {
    Contact: { Municipality?: string; Country?: EuropassLabel };
  };
  Email?: { Contact: string };
  Telephone?: ReadonlyArray<{ Contact: string; Use: { Code: string } }>;
  Website?: ReadonlyArray<{ Contact: string; Use: { Code: string } }>;
}

export interface EuropassWork {
  Period: EuropassPeriod;
  Position: { Label: string };
  Activities?: string;
  Employer: {
    Name: string;
    ContactInfo?: {
      Address?: { Contact: { Municipality: string } };
      Website?: { Contact: string };
    };
  };
}

export interface EuropassEducation {
  Period: EuropassPeriod;
  Title: string;
  Activities?: string;
  Organisation: {
    Name: string;
    ContactInfo?: { Address: { Contact: { Municipality: string } } };
  };
}

export interface EuropassForeignLanguage {
  Description: EuropassLabel;
  ProficiencyLevel?: Partial<
    Record<
      | "Listening"
      | "Reading"
      | "SpokenInteraction"
      | "SpokenProduction"
      | "Writing",
      string
    >
  >;
}

export interface EuropassAchievement {
  Title: EuropassLabel;
  Description: string;
}

export interface EuropassDocument {
  SkillsPassport: {
    Locale: string;
    DocumentInfo: {
      DocumentType: "ECV";
      CreationDate: string;
      LastUpdateDate: string;
      XSDVersion: "V3.4";
      Generator: string;
      Comment: string;
    };
    LearnerInfo: {
      Identification: {
        PersonName: { FirstName: string; Surname: string };
        ContactInfo: EuropassContactInfo;
      };
      Headline?: {
        Type: EuropassLabel;
        Description: { Label: string };
      };
      WorkExperience: ReadonlyArray<EuropassWork>;
      Education: ReadonlyArray<EuropassEducation>;
      Skills: {
        Linguistic?: {
          MotherTongue: ReadonlyArray<{ Description: EuropassLabel }>;
          ForeignLanguage: ReadonlyArray<EuropassForeignLanguage>;
        };
        JobRelated?: { Description: string };
        Driving?: { Description: ReadonlyArray<string> };
        Other?: { Description: string };
      };
      Achievement: ReadonlyArray<EuropassAchievement>;
    };
  };
}

// --- reading the document --------------------------------------------------

function plain(field: Field | undefined): string {
  return field?.kind === "plain" ? S.trim(field.value) : "";
}

function rich(field: Field | undefined): ReadonlyArray<RichBlock> {
  return field?.kind === "richtext" ? tiptapToRichBlocks(field.value) : [];
}

function entriesOf(resume: Resume, type: Section["type"]) {
  return pipe(
    resume.sections,
    A.filter((section) => section.type === type && !section.hidden),
    A.flatMap((section) => section.entries),
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** "Jan 2020" or "2020" as a Europass date; anything else is no date. */
export function europassDate(value: string): EuropassDate | undefined {
  const year = /\b(\d{4})\b/.exec(value)?.[1];
  if (!year) return undefined;
  const month = A.getIndexBy(MONTHS, (name) => S.includes(value, name));
  return O.match(
    month,
    (index) => ({ Year: Number(year), Month: index + 1 }),
    () => ({ Year: Number(year) }),
  );
}

export function europassPeriod(start: string, end: string): EuropassPeriod {
  const from = europassDate(start);
  const to = europassDate(end);
  return {
    ...(from && { From: from }),
    ...(end === "Present" ? { Current: true } : to && { To: to }),
  };
}

function escapeHtml(text: string): string {
  return pipe(
    text,
    S.replaceByRe(/&/g, "&amp;"),
    S.replaceByRe(/</g, "&lt;"),
    S.replaceByRe(/>/g, "&gt;"),
    S.replaceByRe(/"/g, "&quot;"),
  );
}

function runHtml(run: InlineRun): string {
  let html = escapeHtml(run.text);
  if (run.italic) html = `<i>${html}</i>`;
  if (run.bold) html = `<b>${html}</b>`;
  if (run.href) html = `<a href="${escapeHtml(run.href)}">${html}</a>`;
  return html;
}

function runsHtml(runs: ReadonlyArray<InlineRun>): string {
  return pipe(runs, A.map(runHtml), A.join(""));
}

/** The restricted rich text as the small HTML subset Europass accepts. */
export function richToEuropassHtml(blocks: ReadonlyArray<RichBlock>): string {
  return pipe(
    blocks,
    A.map((block) => {
      if (block.type === "paragraph") return `<p>${runsHtml(block.runs)}</p>`;
      const tag = block.ordered ? "ol" : "ul";
      const items = pipe(
        block.items,
        A.map((runs) => `<li>${runsHtml(runs)}</li>`),
        A.join(""),
      );
      return `<${tag}>${items}</${tag}>`;
    }),
    A.join(""),
  );
}

function optionalHtml(blocks: ReadonlyArray<RichBlock>) {
  const html = richToEuropassHtml(blocks);
  return html ? { Activities: html } : {};
}

function withHttps(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

// --- sections --------------------------------------------------------------

function contactInfo(resume: Resume): EuropassContactInfo {
  const fields = resume.header.fields;
  const city = plain(fields.city);
  const country = plain(fields.country);
  const code = countryCode(country);
  const email = plain(fields.email);
  const phone = plain(fields.phone);
  const websites = pipe(
    [plain(fields.website), plain(fields.linkedin), plain(fields.link)],
    A.reject(S.isEmpty),
    A.map((value) => ({
      Contact: withHttps(value),
      Use: { Code: "personal" },
    })),
  );
  return {
    ...((city || country) && {
      Address: {
        Contact: {
          ...(city && { Municipality: city }),
          ...(country && {
            Country: code ? { Code: code, Label: country } : { Label: country },
          }),
        },
      },
    }),
    ...(email && { Email: { Contact: email } }),
    ...(phone && {
      Telephone: [{ Contact: phone, Use: { Code: "mobile" } }],
    }),
    ...(A.isNotEmpty(websites) && { Website: websites }),
  };
}

function jobEntry(entry: Entry, keys: { role: string; org: string }) {
  const city = plain(entry.fields.location);
  const website = plain(entry.fields.website);
  const contact = {
    ...(city && { Address: { Contact: { Municipality: city } } }),
    ...(website && { Website: { Contact: withHttps(website) } }),
  };
  return {
    Period: europassPeriod(
      plain(entry.fields.startDate),
      plain(entry.fields.endDate),
    ),
    Position: { Label: plain(entry.fields[keys.role]) },
    ...optionalHtml(rich(entry.fields.description)),
    Employer: {
      Name: plain(entry.fields[keys.org]),
      ...(D.isNotEmpty(contact) && { ContactInfo: contact }),
    },
  };
}

function workExperience(resume: Resume): ReadonlyArray<EuropassWork> {
  return A.concatMany([
    A.map(entriesOf(resume, "experience"), (entry) =>
      jobEntry(entry, { role: "title", org: "company" }),
    ),
    A.map(entriesOf(resume, "internship"), (entry) =>
      jobEntry(entry, { role: "title", org: "company" }),
    ),
    A.map(entriesOf(resume, "volunteering"), (entry) =>
      jobEntry(entry, { role: "role", org: "organization" }),
    ),
  ]);
}

function education(resume: Resume): ReadonlyArray<EuropassEducation> {
  return A.map(entriesOf(resume, "education"), (entry) => {
    const city = plain(entry.fields.location);
    return {
      Period: europassPeriod(
        plain(entry.fields.startDate),
        plain(entry.fields.endDate),
      ),
      Title: plain(entry.fields.degree),
      ...optionalHtml(rich(entry.fields.details)),
      Organisation: {
        Name: plain(entry.fields.institution),
        ...(city && {
          ContactInfo: { Address: { Contact: { Municipality: city } } },
        }),
      },
    };
  });
}

const CEFR = /^(A1|A2|B1|B2|C1|C2)$/;

function isNative(entry: Entry): boolean {
  const level = S.toLowerCase(plain(entry.fields.level));
  return (
    level === "native" ||
    (plain(entry.fields.speaking) === "native" &&
      plain(entry.fields.writing) === "native")
  );
}

function languageLabel(entry: Entry): EuropassLabel {
  const name = plain(entry.fields.name);
  const code = languageCode(name);
  return code ? { Code: code, Label: name } : { Label: name };
}

function proficiency(
  entry: Entry,
): EuropassForeignLanguage["ProficiencyLevel"] {
  const cefr = (key: string) => {
    const value = plain(entry.fields[key]);
    return CEFR.test(value) ? value : undefined;
  };
  const understanding = cefr("understanding");
  const speaking = cefr("speaking");
  const writing = cefr("writing");
  return D.filter(
    {
      Listening: understanding,
      Reading: understanding,
      SpokenInteraction: speaking,
      SpokenProduction: speaking,
      Writing: writing,
    },
    G.isString,
  ) as EuropassForeignLanguage["ProficiencyLevel"];
}

function linguistic(resume: Resume) {
  const languages = A.filter(entriesOf(resume, "languages"), (entry) =>
    S.isNotEmpty(plain(entry.fields.name)),
  );
  if (A.isEmpty(languages)) return undefined;
  return {
    MotherTongue: pipe(
      languages,
      A.filter(isNative),
      A.map((entry) => ({ Description: languageLabel(entry) })),
    ),
    ForeignLanguage: pipe(
      languages,
      A.reject(isNative),
      A.map((entry) => {
        const level = proficiency(entry);
        return {
          Description: languageLabel(entry),
          ...(level && D.isNotEmpty(level) && { ProficiencyLevel: level }),
        };
      }),
    ),
  };
}

function skillsHtml(resume: Resume): string {
  const items = pipe(
    entriesOf(resume, "skills"),
    A.map((entry) => {
      const name = plain(entry.fields.name);
      const detail = A.join(
        A.reject(
          [plain(entry.fields.level), plain(entry.fields.description)],
          S.isEmpty,
        ),
        ": ",
      );
      return detail
        ? `${escapeHtml(name)} (${escapeHtml(detail)})`
        : escapeHtml(name);
    }),
    A.reject(S.isEmpty),
    A.map((item) => `<li>${item}</li>`),
    A.join(""),
  );
  return items ? `<ul>${items}</ul>` : "";
}

function drivingLicences(resume: Resume): ReadonlyArray<string> {
  return pipe(
    entriesOf(resume, "driving"),
    A.flatMap((entry) => S.split(plain(entry.fields.categories), ",")),
    A.map(S.trim),
    A.reject(S.isEmpty),
  );
}

function firstRich(resume: Resume, type: Section["type"]): string {
  return pipe(
    entriesOf(resume, type),
    A.head,
    O.mapWithDefault("", (entry) =>
      richToEuropassHtml(rich(entry.fields.body)),
    ),
  );
}

function listAchievement(
  entries: ReadonlyArray<Entry>,
  line: (entry: Entry) => string,
): string {
  const items = pipe(
    entries,
    A.map(line),
    A.reject(S.isEmpty),
    A.map((item) => `<li>${item}</li>`),
    A.join(""),
  );
  return items ? `<ul>${items}</ul>` : "";
}

function joinText(parts: ReadonlyArray<string>, separator: string): string {
  return escapeHtml(A.join(A.reject(parts, S.isEmpty), separator));
}

function achievements(resume: Resume): ReadonlyArray<EuropassAchievement> {
  const candidates: ReadonlyArray<readonly [EuropassLabel, string]> = [
    [{ Label: "Summary" }, firstRich(resume, "summary")],
    [
      { Code: "projects", Label: "Projects" },
      listAchievement(entriesOf(resume, "projects"), (entry) =>
        joinText(
          [plain(entry.fields.title), plain(entry.fields.company)],
          ", ",
        ),
      ),
    ],
    [
      { Code: "memberships", Label: "Memberships" },
      listAchievement(entriesOf(resume, "organizations"), (entry) =>
        joinText(
          [plain(entry.fields.role), plain(entry.fields.organization)],
          ", ",
        ),
      ),
    ],
    [
      { Code: "certifications", Label: "Certifications" },
      listAchievement(entriesOf(resume, "certifications"), (entry) =>
        joinText(
          [
            plain(entry.fields.name),
            plain(entry.fields.issuer),
            plain(entry.fields.date),
          ],
          ", ",
        ),
      ),
    ],
    [
      { Code: "courses", Label: "Courses" },
      listAchievement(entriesOf(resume, "courses"), (entry) =>
        joinText(
          [plain(entry.fields.title), plain(entry.fields.provider)],
          ", ",
        ),
      ),
    ],
    [
      { Code: "publications", Label: "Publications" },
      listAchievement(entriesOf(resume, "publications"), (entry) =>
        joinText(
          [
            plain(entry.fields.title),
            plain(entry.fields.publisher),
            plain(entry.fields.date),
          ],
          ", ",
        ),
      ),
    ],
    [
      { Code: "references", Label: "References" },
      listAchievement(entriesOf(resume, "references"), (entry) =>
        joinText(
          [
            plain(entry.fields.name),
            plain(entry.fields.position),
            plain(entry.fields.company),
            plain(entry.fields.email),
            plain(entry.fields.phone),
          ],
          ", ",
        ),
      ),
    ],
  ];
  return pipe(
    candidates,
    A.reject(([, description]) => S.isEmpty(description)),
    A.map(([title, description]) => ({
      Title: title,
      Description: description,
    })),
  );
}

/** The document as a Europass CV (SkillsPassport v3.4) JSON object. */
export function resumeToEuropass(resume: Resume): EuropassDocument {
  const fields = resume.header.fields;
  const headline = plain(fields.jobTitle);
  const jobSkills = skillsHtml(resume);
  const driving = drivingLicences(resume);
  const interests = firstRich(resume, "interests");
  const languages = linguistic(resume);
  return {
    SkillsPassport: {
      Locale: resume.language,
      DocumentInfo: {
        DocumentType: "ECV",
        CreationDate: resume.createdAt,
        LastUpdateDate: resume.updatedAt,
        XSDVersion: "V3.4",
        Generator: "Kast",
        Comment: "Exported from Kast",
      },
      LearnerInfo: {
        Identification: {
          PersonName: {
            FirstName: plain(fields.firstName),
            Surname: plain(fields.lastName),
          },
          ContactInfo: contactInfo(resume),
        },
        ...(headline && {
          Headline: {
            Type: { Code: "position", Label: "Position" },
            Description: { Label: headline },
          },
        }),
        WorkExperience: workExperience(resume),
        Education: education(resume),
        Skills: {
          ...(languages && { Linguistic: languages }),
          ...(jobSkills && { JobRelated: { Description: jobSkills } }),
          ...(A.isNotEmpty(driving) && { Driving: { Description: driving } }),
          ...(interests && { Other: { Description: interests } }),
        },
        Achievement: achievements(resume),
      },
    },
  };
}
