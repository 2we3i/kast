import { A, pipe, S } from "@mobily/ts-belt";
import type { RuleCheck } from "./types";

/** ATS mode is the upload-safe presentation; design mode is for people. */
export const atsMode: RuleCheck = (context) => {
  const ok = context.resume.atsMode ?? true;
  return { score: ok ? 1 : 0.5, issues: ok ? [] : [{}] };
};

function uniqueMatches(text: string, pattern: RegExp): ReadonlyArray<string> {
  return pipe(
    Array.from(text.matchAll(pattern), (match) => match[0]),
    A.uniq,
  );
}

/** Decorative bullet glyphs parsers read as garbage or drop. */
export const specialBullets: RuleCheck = (context) => {
  const pattern = new RegExp(String(context.params.pattern), "gu");
  const found = uniqueMatches(context.text, pattern);
  return {
    score: A.isEmpty(found) ? 1 : 0,
    issues: A.isEmpty(found) ? [] : [{ params: { chars: A.join(found, " ") } }],
  };
};

export const emoji: RuleCheck = (context) => {
  const pattern = new RegExp(String(context.params.pattern), "gu");
  const found = uniqueMatches(context.text, pattern);
  return {
    score: A.isEmpty(found) ? 1 : 0,
    issues: A.isEmpty(found) ? [] : [{ params: { chars: A.join(found, " ") } }],
  };
};

/** Wide letter spacing makes extractors split words apart. */
export const letterSpacing: RuleCheck = (context) => {
  const max = Number(context.params.max);
  const value = Math.abs(context.resume.letterSpacing ?? 0);
  const ok = value <= max;
  return {
    score: ok ? 1 : 0,
    issues: ok ? [] : [{ params: { value: S.make(value) } }],
  };
};
