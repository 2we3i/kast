import { pipe, S } from "@mobily/ts-belt";

/**
 * Sanitizes a user-typed file name: strips characters illegal in file names and
 * a redundant trailing extension, preserving spaces and case. Falls back to
 * "resume" when nothing usable remains.
 */
export function safeFileName(name: string): string {
  const cleaned = pipe(
    name,
    S.replaceByRe(/\.(pdf|docx|txt|json|ya?ml|xml)$/i, ""),
    S.replaceByRe(/[\\/:*?"<>|]+/g, "-"),
    S.trim,
  );
  return cleaned || "resume";
}

/**
 * Writes `blob` out as `fileName` through an anchor click; the browser drops
 * the file in its download directory. Every export goes through here.
 */
export async function triggerDownload(
  blob: Blob,
  fileName: string,
): Promise<boolean> {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Firefox and Safari read the blob after the click handler returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return true;
}
