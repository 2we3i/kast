import { A, pipe, S } from "@mobily/ts-belt";
import { emptyRichTextValue } from "@/lib/resume/factory";
import { RESUME_LABELS } from "@/lib/resume/labels";
import { type RichBlock, tiptapToRichBlocks } from "@/lib/resume/rich-content";
import type { CoverLetter, Resume, ResumeLanguage } from "@/lib/resume/types";
import type { HeaderView } from "../resume-preview";
import { toHeaderView } from "../resume-to-preview-header";

/** The cover letter as every renderer draws it: screen, PDF, DOCX, text. */
export interface LetterView {
  header: HeaderView;
  language: ResumeLanguage;
  date: string;
  /** Recipient block lines: the person, then the company. */
  recipient: ReadonlyArray<string>;
  subject: string;
  body: ReadonlyArray<RichBlock>;
  closing: string;
  signature: string;
}

export function emptyCoverLetter(): CoverLetter {
  return {
    recipient: "",
    company: "",
    date: "",
    subject: "",
    body: emptyRichTextValue(),
    closing: "",
  };
}

/** Today's date written out in the document's language. */
export function letterDate(language: ResumeLanguage, today: Date): string {
  const locale = { en: "en-GB", lt: "lt-LT", ru: "ru-RU" }[language];
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(today);
}

const DEFAULT_CLOSING: Record<ResumeLanguage, string> = {
  en: "Kind regards,",
  lt: "Pagarbiai,",
  ru: "С уважением,",
};

export function toLetterView(resume: Resume, today = new Date()): LetterView {
  const letter = resume.coverLetter ?? emptyCoverLetter();
  const header = toHeaderView(resume);
  return {
    header,
    language: resume.language,
    date: S.trim(letter.date) || letterDate(resume.language, today),
    recipient: pipe(
      [letter.recipient, letter.company],
      A.map(S.trim),
      A.reject(S.isEmpty),
    ),
    subject: S.trim(letter.subject),
    body: tiptapToRichBlocks(letter.body),
    closing: S.trim(letter.closing) || DEFAULT_CLOSING[resume.language],
    signature: header.fullName,
  };
}

/** The heading used when a letter has no subject of its own. */
export function letterHeading(view: LetterView): string {
  return view.subject || RESUME_LABELS[view.language].coverLetter;
}
