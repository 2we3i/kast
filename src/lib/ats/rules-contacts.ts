import { S } from "@mobily/ts-belt";
import { plain } from "./read";
import type { RuleCheck } from "./types";

export const emailPresent: RuleCheck = (context) => {
  const ok = S.isNotEmpty(plain(context.resume.header.fields.email));
  return { score: ok ? 1 : 0, issues: ok ? [] : [{}] };
};

export const emailFormat: RuleCheck = (context) => {
  const email = plain(context.resume.header.fields.email);
  if (S.isEmpty(email)) return null;
  const ok = new RegExp(String(context.params.pattern), "u").test(email);
  return { score: ok ? 1 : 0, issues: ok ? [] : [{ params: { email } }] };
};

export const phonePresent: RuleCheck = (context) => {
  const ok = S.isNotEmpty(plain(context.resume.header.fields.phone));
  return { score: ok ? 1 : 0, issues: ok ? [] : [{}] };
};

/**
 * A phone parsers can dial: digits with the usual separators, enough digits,
 * and ideally an international prefix.
 */
export const phoneFormat: RuleCheck = (context) => {
  const phone = plain(context.resume.header.fields.phone);
  if (S.isEmpty(phone)) return null;
  const digits = S.replaceByRe(phone, /\D/g, "");
  const ok =
    new RegExp(String(context.params.pattern), "u").test(phone) &&
    S.length(digits) >= Number(context.params.minDigits);
  return { score: ok ? 1 : 0, issues: ok ? [] : [{ params: { phone } }] };
};

export const locationPresent: RuleCheck = (context) => {
  const fields = context.resume.header.fields;
  const ok = S.isNotEmpty(plain(fields.city) + plain(fields.country));
  return { score: ok ? 1 : 0, issues: ok ? [] : [{}] };
};
