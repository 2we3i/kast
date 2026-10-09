import { A, pipe, S } from "@mobily/ts-belt";

/** Pages beyond which recruiters start skimming; the editor warns past it. */
export const RECOMMENDED_MAX_PAGES = 2;

/**
 * Words in a plain-text rendering: runs of letters or digits in any script,
 * so Lithuanian and Cyrillic words count the same as English ones.
 */
export function countWords(text: string): number {
  return pipe(
    text,
    S.splitByRe(/\s+/),
    A.filter((token): token is string => /[\p{L}\p{N}]/u.test(token ?? "")),
    A.length,
  );
}
