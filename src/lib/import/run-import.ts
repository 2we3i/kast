import { R } from "@mobily/ts-belt";
import type { ParseOptions, PdfImportResult } from "./index";

/**
 * Runs a PDF import, resolving with a draft for the review screen. The heavy
 * stack (pdf.js via unpdf, the layout analysis, the dictionaries) is split
 * behind this dynamic import, so it downloads only when someone imports.
 * Any unexpected failure degrades to a generic error the UI can show.
 */
export async function runPdfImport(
  bytes: ArrayBuffer,
  options: ParseOptions,
): Promise<PdfImportResult> {
  try {
    const { importPdf } = await import("./pdf-import");
    return await importPdf(new Uint8Array(bytes), options);
  } catch {
    return R.makeError("error");
  }
}
