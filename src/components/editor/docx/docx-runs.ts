import { A, pipe } from "@mobily/ts-belt";
import {
  ExternalHyperlink,
  ImageRun,
  type IRunOptions,
  Paragraph,
  TextRun,
} from "docx";
import type { InlineRun, RichBlock } from "@/lib/resume/rich-content";
import type { ContactView, HeaderView } from "../resume-preview";
import {
  BULLET_LIST,
  DOCX_HEADINGS,
  MUTED,
  NUMBERED_LIST,
} from "./docx-styles";

/** Linked runs are underlined; plain runs carry no underline. */
export function linkUnderline(
  href: string | undefined,
): IRunOptions["underline"] {
  if (!href) return undefined;
  return {};
}

export function linkedRun(
  child: TextRun,
  href: string | undefined,
): TextRun | ExternalHyperlink {
  if (!href) return child;
  return new ExternalHyperlink({ link: href, children: [child] });
}

/** A muted run of `prefix + value`, or nothing when `value` is empty. */
export function mutedTail(
  value: string,
  prefix: string,
): ReadonlyArray<TextRun> {
  if (!value) return [];
  return [new TextRun({ text: `${prefix}${value}`, color: MUTED })];
}

export function inlineRuns(
  runs: ReadonlyArray<InlineRun>,
): ReadonlyArray<TextRun | ExternalHyperlink> {
  return A.map(runs, (run) => {
    const child = new TextRun({
      text: run.text,
      bold: run.bold,
      italics: run.italic,
      underline: linkUnderline(run.href),
    });
    return linkedRun(child, run.href);
  });
}

/**
 * Rich text as Word paragraphs with real list numbering. `instanceBase`
 * gives every ordered list its own numbering instance, so each one restarts
 * at 1; callers pass a value unique to the field.
 */
export function richParagraphs(
  blocks: ReadonlyArray<RichBlock>,
  instanceBase: number,
): ReadonlyArray<Paragraph> {
  return A.flat(
    A.mapWithIndex(blocks, (index, block): ReadonlyArray<Paragraph> => {
      if (block.type === "paragraph") {
        return [
          new Paragraph({
            children: inlineRuns(block.runs),
            spacing: { after: 80 },
          }),
        ];
      }
      return A.map(
        block.items,
        (item) =>
          new Paragraph({
            children: inlineRuns(item),
            numbering: block.ordered
              ? {
                  reference: NUMBERED_LIST,
                  level: 0,
                  instance: instanceBase + index,
                }
              : { reference: BULLET_LIST, level: 0 },
            spacing: { after: 40 },
          }),
      );
    }),
  );
}

/**
 * The photo data URL is a pre-cropped square JPEG from the upload path;
 * decode the base64 payload for docx's ImageRun.
 */
function photoRuns(
  photo: string | undefined,
  size: number,
): ReadonlyArray<ImageRun> {
  if (!photo) return [];
  const match = photo.match(/^data:image\/(jpeg|png);base64,(.+)$/);
  if (!match) return [];
  const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
  return [
    new ImageRun({
      type: match[1] === "png" ? "png" : "jpg",
      data: bytes,
      transformation: { width: size, height: size },
    }),
  ];
}

function contactRuns(
  contacts: ReadonlyArray<ContactView>,
): ReadonlyArray<TextRun | ExternalHyperlink> {
  return pipe(
    contacts,
    A.zipWithIndex,
    A.flatMap(
      ([contact, index]): ReadonlyArray<TextRun | ExternalHyperlink> => {
        const child = new TextRun({
          text: contact.value,
          underline: linkUnderline(contact.href),
        });
        const run = linkedRun(child, contact.href);
        if (index === 0) return [run];
        return [new TextRun({ text: "   |   ", color: MUTED }), run];
      },
    ),
  );
}

export function headerParagraphs(header: HeaderView): ReadonlyArray<Paragraph> {
  // The photo rides inside the name paragraph: no extra paragraph means the
  // extracted text stays byte-identical with and without a photo.
  const headline = header.headline
    ? [
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: header.headline, size: 21, color: MUTED }),
          ],
        }),
      ]
    : [];
  const contacts = A.isNotEmpty(header.contacts)
    ? [
        new Paragraph({
          spacing: { after: 80 },
          children: contactRuns(header.contacts),
        }),
      ]
    : [];
  return [
    new Paragraph({
      heading: DOCX_HEADINGS.name,
      children: [
        ...photoRuns(header.photo, header.photoSize),
        new TextRun({ text: header.fullName }),
      ],
    }),
    ...headline,
    ...contacts,
  ];
}
