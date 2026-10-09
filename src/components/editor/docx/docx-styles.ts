import {
  AlignmentType,
  Document,
  HeadingLevel,
  LevelFormat,
  type Paragraph,
} from "docx";

export const MUTED = "525252";
export const INK = "0A0A0A";

/** Right page edge in twips for A4 with default 1-inch margins (11906 − 2·1440). */
export const RIGHT_TAB = 9026;

export const BULLET_LIST = "kast-bullets";
export const NUMBERED_LIST = "kast-numbers";

/** The heading level each résumé element is styled with. */
export const DOCX_HEADINGS = {
  name: HeadingLevel.HEADING_1,
  section: HeadingLevel.HEADING_2,
  entry: HeadingLevel.HEADING_3,
} as const;

interface DocxDocumentParams {
  children: ReadonlyArray<Paragraph>;
  /** Heading color as rrggbb (no #); ink in ATS mode. */
  accent: string;
}

/**
 * A Word document with real styles: Heading 1 for the name, Heading 2 for
 * section headings, Heading 3 for entry titles, and real bulleted and
 * numbered lists. Word's navigation pane and ATS parsers both read these.
 */
export function buildDocxDocument(params: DocxDocumentParams): Document {
  const heading = (size: number, color: string) => ({
    run: { font: "Calibri", size, bold: true, color },
    paragraph: { spacing: { before: 0, after: 0 } },
  });
  return new Document({
    creator: "Kast",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 20, color: INK } },
        heading1: heading(36, INK),
        heading2: {
          run: { font: "Calibri", size: 20, bold: true, color: params.accent },
          paragraph: { spacing: { before: 220, after: 100 } },
        },
        heading3: heading(19, INK),
      },
    },
    numbering: {
      config: [
        {
          reference: BULLET_LIST,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 260 } } },
            },
          ],
        },
        {
          reference: NUMBERED_LIST,
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 260 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 } } },
        children: [...params.children],
      },
    ],
  });
}
