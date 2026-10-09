import { A, S } from "@mobily/ts-belt";
import { type Document, Paragraph, TabStopType, TextRun } from "docx";
import type { TemplateId } from "@/lib/templates";
import { buildResumeBlocks, type ResumeBlock } from "../resume-blocks";
import { dateRangeText } from "../resume-date-range";
import { locationSuffix, withLocation } from "../resume-entry-location";
import { resolveResumeAccent } from "../resume-fonts";
import type {
  EducationItemView,
  ExperienceItemView,
  ResumePreview,
} from "../resume-preview";
import {
  headerParagraphs,
  linkedRun,
  linkUnderline,
  mutedTail,
  richParagraphs,
} from "./docx-runs";
import {
  buildDocxDocument,
  DOCX_HEADINGS,
  MUTED,
  RIGHT_TAB,
} from "./docx-styles";

function sectionHeading(title: string): Paragraph {
  return new Paragraph({
    heading: DOCX_HEADINGS.section,
    children: [new TextRun({ text: S.toUpperCase(title) })],
  });
}

interface TitleRowParams {
  title: string;
  date: string;
  href?: string;
}

/** A "Title …… Dates" row (Heading 3) with the date on a right tab stop. */
function titleRow(params: TitleRowParams): Paragraph {
  const { title, date, href } = params;
  const titleRun = new TextRun({
    text: title,
    underline: linkUnderline(href),
  });
  return new Paragraph({
    heading: DOCX_HEADINGS.entry,
    tabStops: [{ type: TabStopType.RIGHT, position: RIGHT_TAB }],
    children: [
      linkedRun(titleRun, href),
      ...(date
        ? [new TextRun({ text: `\t${date}`, bold: false, color: MUTED })]
        : []),
    ],
  });
}

interface SubtitleParams {
  text: string;
  href?: string;
  suffix?: string;
}

/** A muted subtitle: an optionally linked subject, then a plain-text tail. */
function subtitle(params: SubtitleParams): Paragraph {
  const { text, href, suffix = "" } = params;
  const child = new TextRun({
    text,
    color: MUTED,
    underline: linkUnderline(href),
  });
  return new Paragraph({
    spacing: { after: 40 },
    children: [linkedRun(child, href), ...mutedTail(suffix, "")],
  });
}

function optionalSubtitle(text: string | undefined): ReadonlyArray<Paragraph> {
  if (!text) return [];
  return [subtitle({ text })];
}

function gridParagraphs(
  items: ReadonlyArray<{ name: string; proficiency: string; detail: string }>,
): ReadonlyArray<Paragraph> {
  return A.map(
    items,
    (item) =>
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({ text: item.name, bold: true }),
          ...mutedTail(item.proficiency, " - "),
          ...mutedTail(item.detail, ". "),
        ],
      }),
  );
}

function companyParagraphs(item: ExperienceItemView): ReadonlyArray<Paragraph> {
  if (!item.company && !item.location) return [];
  return [
    subtitle({
      text: item.company,
      href: item.companyHref,
      suffix: locationSuffix(item.company, item.location),
    }),
  ];
}

function experienceParagraphs(
  item: ExperienceItemView,
  instance: number,
): ReadonlyArray<Paragraph> {
  return [
    titleRow({
      title: item.role,
      date: dateRangeText(item.startDate, item.endDate, "-"),
      href: item.roleHref,
    }),
    ...companyParagraphs(item),
    ...optionalSubtitle(item.companyContext),
    ...richParagraphs(item.description, instance),
  ];
}

function educationParagraphs(
  item: EducationItemView,
  instance: number,
): ReadonlyArray<Paragraph> {
  return [
    titleRow({
      title: item.degree,
      date: dateRangeText(item.startDate, item.endDate, "-"),
    }),
    ...optionalSubtitle(withLocation(item.institution, item.location)),
    ...richParagraphs(item.details, instance),
  ];
}

function blockParagraphs(
  block: ResumeBlock,
  index: number,
): ReadonlyArray<Paragraph> {
  // Each block owns a range of numbering instances so ordered lists restart.
  const instance = index * 100 + 1;
  switch (block.kind) {
    case "header":
      return headerParagraphs(block.header);
    case "heading":
      return [sectionHeading(block.title)];
    case "summary":
      return richParagraphs(block.body, instance);
    case "experience":
      return experienceParagraphs(block.item, instance);
    case "education":
      return educationParagraphs(block.item, instance);
    case "certificate":
      return [
        titleRow({
          title: block.item.title,
          date: dateRangeText(block.item.startDate, block.item.endDate, "-"),
          href: block.item.href,
        }),
        ...optionalSubtitle(block.item.issuer),
      ];
    case "skills":
      return gridParagraphs(
        A.map(block.items, (item) => ({ ...item, detail: item.description })),
      );
    case "languages":
      return gridParagraphs(
        A.map(block.items, (item) => ({ ...item, detail: item.skills })),
      );
  }
}

/**
 * Builds the résumé as a .docx `Document` in linear reading order, reusing
 * `buildResumeBlocks` so content, ordering, sorting, and empty-section gating
 * match the preview and other exports. No tables or columns are used, so the
 * document stays ATS-parseable; headings are real Heading styles, lists real
 * Word lists, and marks (bold/italic/links) are kept.
 */
export function buildResumeDocx(
  preview: ResumePreview,
  template: TemplateId,
): Document {
  const children = A.flat(
    A.mapWithIndex(buildResumeBlocks(preview), (index, block) =>
      blockParagraphs(block, index),
    ),
  );
  const accent = resolveResumeAccent(preview, template).slice(1);
  return buildDocxDocument({ children, accent });
}
