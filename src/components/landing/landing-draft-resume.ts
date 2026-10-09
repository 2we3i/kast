import { S } from "@mobily/ts-belt";
import type { PlainField, Resume, ResumeLanguage } from "@/lib/resume";
import { sampleResume } from "@/lib/resume/seed-samples";
import type { LandingDraft } from "@/lib/store";
import { joinPresent } from "@/lib/utils";

/**
 * The landing draft materialized as a full document: the sample resume with
 * the visitor's own name and title layered over it. Used identically by the
 * live preview, the in-browser parser proof, and the create handoff, so what
 * the visitor sees, what gets verified, and what lands in the editor are the
 * same document.
 */
export function draftToResume(
  draft: LandingDraft,
  language: ResumeLanguage,
): Resume {
  const resume = structuredClone(sampleResume(language));
  const firstName = S.trim(draft.firstName);
  const lastName = S.trim(draft.lastName);
  const jobTitle = S.trim(draft.jobTitle);
  return {
    ...resume,
    header: {
      ...resume.header,
      fields: {
        ...resume.header.fields,
        ...(S.isNotEmpty(firstName) && { firstName: plainField(firstName) }),
        ...(S.isNotEmpty(lastName) && { lastName: plainField(lastName) }),
        ...(S.isNotEmpty(jobTitle) && { jobTitle: plainField(jobTitle) }),
      },
    },
  };
}

function plainField(value: string): PlainField {
  return { kind: "plain", value };
}

export function draftFullName(draft: LandingDraft): string {
  return joinPresent([S.trim(draft.firstName), S.trim(draft.lastName)], " ");
}

export function draftHasContent(draft: LandingDraft): boolean {
  return Boolean(
    S.trim(draft.firstName) || S.trim(draft.lastName) || S.trim(draft.jobTitle),
  );
}
