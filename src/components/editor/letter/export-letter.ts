import { A, pipe, S } from "@mobily/ts-belt";
import { Packer, Paragraph, TextRun } from "docx";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { richBlocksToText } from "@/lib/resume/rich-content";
import type { Resume } from "@/lib/resume/types";
import { resolveTemplateId } from "@/lib/templates";
import { headerParagraphs, richParagraphs } from "../docx/docx-runs";
import { buildDocxDocument, MUTED } from "../docx/docx-styles";
import { safeFileName, triggerDownload } from "../download-file";
import { resolveResumeAccent, resumeTypographyStyle } from "../resume-fonts";
import { A4 } from "../resume-geometry";
import { ResumeModeContext } from "../resume-mode";
import { TextListMarkersContext } from "../resume-rich-text";
import { resumeToPreview } from "../resume-to-preview";
import { RESUME_PDF_CSS } from "../takumi/takumi-css";
import { fetchFontFile, resumeFontLoaders } from "../takumi/takumi-fonts";
import { TEMPLATE_BLOCK_VIEWS } from "../templates/template-block-view";
import { LetterBody } from "./letter-body";
import { type LetterView, toLetterView } from "./letter-view";

export type LetterFormat = "pdf" | "docx" | "txt";

/** The letter as plain text, in reading order. */
export function letterToText(view: LetterView): string {
  const contacts = A.map(view.header.contacts, (contact) => contact.value);
  return `${pipe(
    [
      view.header.fullName,
      view.header.headline,
      ...contacts,
      "",
      view.date,
      "",
      ...view.recipient,
      "",
      view.subject,
      "",
      ...A.flatMap(richBlocksToText(view.body), (line) => [line, ""]),
      view.closing,
      view.signature,
    ],
    A.join("\n"),
    S.replaceByRe(/\n{3,}/g, "\n\n"),
    S.trim,
  )}\n`;
}

function letterDocx(view: LetterView, accent: string) {
  const line = (text: string, color?: string) =>
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text, color })],
    });
  const children = [
    ...headerParagraphs(view.header),
    new Paragraph({ spacing: { before: 240 }, children: [] }),
    line(view.date, MUTED),
    ...A.map(view.recipient, (text) => line(text)),
    ...(view.subject
      ? [
          new Paragraph({
            spacing: { before: 240, after: 120 },
            children: [new TextRun({ text: view.subject, bold: true })],
          }),
        ]
      : []),
    ...richParagraphs(view.body, 1),
    new Paragraph({ spacing: { before: 240 }, children: [] }),
    line(view.closing),
    new Paragraph({
      spacing: { before: 360 },
      children: [new TextRun({ text: view.signature, bold: true })],
    }),
  ];
  return buildDocxDocument({ children, accent });
}

async function letterPdf(resume: Resume, view: LetterView) {
  const { PdfRenderer } = await import("takumi-pdf");
  const preview = resumeToPreview(resume);
  const template = resolveTemplateId(resume.templateId);
  const BlockView = TEMPLATE_BLOCK_VIEWS[template];
  const html = renderToStaticMarkup(
    createElement(
      "div",
      {
        "data-resume-flow": true,
        className: "font-sans text-foreground",
        style: resumeTypographyStyle(preview, template),
      },
      createElement(
        ResumeModeContext,
        { value: { atsMode: preview.atsMode } },
        createElement(
          TextListMarkersContext,
          { value: true },
          createElement(BlockView, {
            block: {
              id: "header",
              kind: "header",
              header: view.header,
              gapBefore: 0,
              keepWithNext: false,
            },
          }),
          createElement(LetterBody, { view }),
        ),
      ),
    ),
  );
  return new PdfRenderer().render(html, {
    size: "a4",
    margin: A4.marginPx,
    css: RESUME_PDF_CSS,
    fonts: [
      ...resumeFontLoaders({
        fontId: preview.font ?? undefined,
        readFile: fetchFontFile,
      }),
    ],
    lang: preview.language,
    uncoveredText: "placeholder",
  });
}

/**
 * Downloads the cover letter. The PDF reuses the résumé's template header and
 * stylesheet; the DOCX and text follow the same order. All in the browser.
 */
export async function downloadLetter(
  resume: Resume,
  format: LetterFormat,
): Promise<boolean> {
  const view = toLetterView(resume);
  const name = `${safeFileName(resume.title)} - ${safeFileName(view.subject || "cover letter")}`;
  if (format === "txt") {
    const blob = new Blob([letterToText(view)], {
      type: "text/plain;charset=utf-8",
    });
    return triggerDownload(blob, `${name}.txt`);
  }
  if (format === "docx") {
    const preview = resumeToPreview(resume);
    const accent = resolveResumeAccent(
      preview,
      resolveTemplateId(resume.templateId),
    ).slice(1);
    const blob = await Packer.toBlob(letterDocx(view, accent));
    return triggerDownload(blob, `${name}.docx`);
  }
  const bytes = await letterPdf(resume, view).catch(() => null);
  if (!bytes) return false;
  return triggerDownload(
    new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
    `${name}.pdf`,
  );
}
