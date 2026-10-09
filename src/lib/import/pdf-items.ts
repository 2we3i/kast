import { A, R, S } from "@mobily/ts-belt";

/**
 * Positioned text from a PDF, read with pdf.js (bundled by unpdf) entirely in
 * the browser. Each item keeps where it sits and how it is set, because the
 * stream order is often scrambled (a sidebar can come last) and only the
 * coordinates recover the reading order.
 */

export interface PdfItem {
  page: number;
  /** Left edge, in points from the page's left. */
  x: number;
  /** Baseline, in points from the page's top. */
  top: number;
  width: number;
  /** Font size in points. */
  size: number;
  text: string;
  bold: boolean;
  /** Set at an angle: watermarks and margin notes. */
  rotated: boolean;
}

export interface PdfPage {
  number: number;
  width: number;
  height: number;
  items: ReadonlyArray<PdfItem>;
}

export interface PdfDocument {
  pages: ReadonlyArray<PdfPage>;
}

export type ImportFailure =
  | "too-large"
  | "too-many-pages"
  | "no-text"
  | "encrypted"
  | "error";

/** Import limits from the spec: 10 MB and 10 pages. */
export const IMPORT_LIMITS = { bytes: 10 * 1024 * 1024, pages: 10 } as const;

/** Fewer characters than this across the file means a scan with no text. */
const MIN_TEXT_CHARS = 40;

interface TextItemLike {
  str: string;
  transform: number[];
  width: number;
  fontName: string;
}

function isTextItem(item: unknown): item is TextItemLike {
  return typeof (item as TextItemLike).str === "string";
}

interface PageProxyLike {
  getViewport: (params: { scale: number }) => { width: number; height: number };
  getTextContent: () => Promise<{ items: unknown[] }>;
  getOperatorList: () => Promise<unknown>;
  commonObjs: { get: (name: string) => { name?: string } | undefined };
}

/** Font names that carry weight: "Roboto-Bold", "ArialMT-Black". */
async function boldFonts(
  page: PageProxyLike,
  names: ReadonlyArray<string>,
): Promise<Set<string>> {
  try {
    await page.getOperatorList();
    return new Set(
      A.filter(names, (name) => {
        try {
          const font = page.commonObjs.get(name);
          return /bold|black|heavy|semibold|demi/i.test(font?.name ?? "");
        } catch {
          return false;
        }
      }),
    );
  } catch {
    return new Set();
  }
}

async function readPage(page: PageProxyLike, number: number): Promise<PdfPage> {
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const textItems = A.filter(content.items, isTextItem);
  const bold = await boldFonts(
    page,
    A.uniq(A.map(textItems, (item) => item.fontName)),
  );
  const items = A.filterMap(textItems, (item) => {
    const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0] = item.transform;
    const text = S.replaceByRe(item.str, /[\s ]+/g, " ");
    if (S.isEmpty(S.trim(text))) return undefined;
    return {
      page: number,
      x: e,
      top: viewport.height - f,
      width: item.width,
      size: Math.round(Math.hypot(c, d) * 10) / 10 || Math.abs(a),
      text,
      bold: bold.has(item.fontName),
      rotated: Math.abs(b) > 0.01 || Math.abs(c) > 0.01,
    };
  });
  return { number, width: viewport.width, height: viewport.height, items };
}

/**
 * Reads every page's positioned text. Fails with a reason the UI explains:
 * over the size or page limit, password-protected, or a scan with no text
 * layer (which needs OCR, planned for a later version).
 */
export async function extractPdfItems(
  bytes: Uint8Array,
): Promise<R.Result<PdfDocument, ImportFailure>> {
  if (bytes.byteLength > IMPORT_LIMITS.bytes) return R.makeError("too-large");
  try {
    const { getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    if (pdf.numPages > IMPORT_LIMITS.pages) {
      return R.makeError("too-many-pages");
    }
    const pages: PdfPage[] = [];
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = (await pdf.getPage(number)) as unknown as PageProxyLike;
      pages.push(await readPage(page, number));
    }
    const chars = A.reduce(pages, 0, (sum, page) =>
      A.reduce(
        page.items,
        sum,
        (total, item) => total + S.length(S.trim(item.text)),
      ),
    );
    if (chars < MIN_TEXT_CHARS) return R.makeError("no-text");
    return R.makeOk({ pages });
  } catch (error) {
    const message = S.toLowerCase(
      String((error as { message?: unknown })?.message ?? error),
    );
    if (S.includes(message, "password") || S.includes(message, "encrypt")) {
      return R.makeError("encrypted");
    }
    return R.makeError("error");
  }
}
