import type { JSONContent } from "@tiptap/core";
import { cloneResumeAsNew, createEmptyResume } from "@/lib/resume/factory";
import { SEED_RESUME } from "@/lib/resume/seed";
import type { Field, Resume, Section } from "@/lib/resume/types";

/** Fictional test data only: no real person's contacts ever go in here. */

export function plain(value: string): Field {
  return { kind: "plain", value };
}

export function bullets(...items: string[]): Field {
  const doc: JSONContent = {
    type: "doc",
    content: [
      {
        type: "bulletList",
        content: items.map((text) => ({
          type: "listItem",
          content: [{ type: "paragraph", content: [{ type: "text", text }] }],
        })),
      },
    ],
  };
  return { kind: "richtext", value: doc };
}

export function paragraph(text: string): Field {
  return {
    kind: "richtext",
    value: {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    },
  };
}

export function seedResume(): Resume {
  return cloneResumeAsNew(SEED_RESUME, "Seed");
}

export function emptyResume(): Resume {
  return createEmptyResume("Empty");
}

export function withSection(
  resume: Resume,
  type: Section["type"],
  update: (section: Section) => Section,
): Resume {
  return {
    ...resume,
    sections: resume.sections.map((section) =>
      section.type === type ? update(section) : section,
    ),
  };
}
