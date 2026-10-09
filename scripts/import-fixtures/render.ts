import type { PDFDocument } from "pdf-lib";
import { degrees, type PDFFont, type PDFPage, rgb } from "pdf-lib";

/**
 * A tiny page writer for the fixtures: places text by its top edge in
 * points (as a reader sees the page), wraps paragraphs, breaks pages, and
 * adds running headers, footers, page numbers, and watermarks.
 */

export const PAGE = { width: 595.28, height: 841.89, bottom: 790 } as const;

export interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

export interface Furniture {
  header?: string;
  footer?: string;
  /** Formats the page number, e.g. (n, total) => `${n}/${total}`. */
  pageNumber?: (page: number, total: number) => string;
  watermark?: string;
}

export class Writer {
  pages: PDFPage[] = [];
  page: PDFPage;
  top = 60;

  constructor(
    readonly doc: PDFDocument,
    readonly fonts: Fonts,
    readonly furniture: Furniture = {},
  ) {
    this.page = this.addPage();
  }

  addPage(): PDFPage {
    const page = this.doc.addPage([PAGE.width, PAGE.height]);
    this.pages.push(page);
    this.page = page;
    this.top = 60;
    return page;
  }

  ensure(height: number): void {
    if (this.top + height > PAGE.bottom) this.addPage();
  }

  text(
    value: string,
    x: number,
    options: {
      size?: number;
      bold?: boolean;
      top?: number;
      page?: PDFPage;
    } = {},
  ): void {
    const size = options.size ?? 9;
    const font = options.bold ? this.fonts.bold : this.fonts.regular;
    const page = options.page ?? this.page;
    page.drawText(value, {
      x,
      y: PAGE.height - (options.top ?? this.top),
      size,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });
  }

  /** Right-aligned at `right`, on the current line. */
  textRight(
    value: string,
    right: number,
    options: { size?: number; bold?: boolean } = {},
  ): void {
    const size = options.size ?? 9;
    const font = options.bold ? this.fonts.bold : this.fonts.regular;
    this.text(value, right - font.widthOfTextAtSize(value, size), options);
  }

  /** Word-wrapped paragraph; advances the cursor. */
  paragraph(
    value: string,
    x: number,
    width: number,
    options: { size?: number; bold?: boolean; leading?: number } = {},
  ): void {
    const size = options.size ?? 9;
    const font = options.bold ? this.fonts.bold : this.fonts.regular;
    const leading = options.leading ?? size * 1.4;
    const words = value.split(/\s+/);
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > width && line) {
        this.ensure(leading);
        this.text(line, x, options);
        this.top += leading;
        line = word;
      } else {
        line = next;
      }
    }
    if (line) {
      this.ensure(leading);
      this.text(line, x, options);
      this.top += leading;
    }
  }

  gap(points: number): void {
    this.top += points;
  }

  /** Running header and footer, page numbers, and watermark on every page. */
  finish(): void {
    const total = this.pages.length;
    this.pages.forEach((page, index) => {
      if (this.furniture.header) {
        this.text(this.furniture.header, 40, { size: 7, top: 28, page });
      }
      if (this.furniture.footer) {
        this.text(this.furniture.footer, 40, { size: 7, top: 820, page });
      }
      if (this.furniture.pageNumber) {
        this.text(this.furniture.pageNumber(index + 1, total), 520, {
          size: 7,
          top: 820,
          page,
        });
      }
      if (this.furniture.watermark) {
        page.drawText(this.furniture.watermark, {
          x: 140,
          y: 300,
          size: 60,
          font: this.fonts.bold,
          color: rgb(0.85, 0.85, 0.85),
          rotate: degrees(40),
        });
      }
    });
  }
}
