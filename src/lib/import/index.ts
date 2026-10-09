import type { R } from "@mobily/ts-belt";
import type { Resume } from "@/lib/resume/types";
import type { ImportDraft } from "./import-draft";
import type { ImportFailure } from "./pdf-items";

export type { ImportDraft, ImportMetadata } from "./import-draft";
export { REVIEW_THRESHOLD } from "./import-draft";
export type { ImportOptions as ParseOptions } from "./pdf-import";
export type { ImportFailure } from "./pdf-items";
export { IMPORT_LIMITS } from "./pdf-items";

/** An import ready to become a résumé: the document and what fit nowhere. */
export interface ParseResult {
  resume: Resume;
  leftovers: string[];
}

export type PdfImportResult = R.Result<ImportDraft, ImportFailure>;
