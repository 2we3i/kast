import { A, pipe, S } from "@mobily/ts-belt";
import { renderSVG } from "uqr";
import { RESUME_LABELS } from "@/lib/resume/labels";
import type { Field, Resume } from "@/lib/resume/types";
import { joinPresent } from "@/lib/utils";
import type { ContactKind, ContactView, HeaderView } from "./resume-preview";

export function plain(field: Field | undefined): string {
  return field?.kind === "plain" ? S.trim(field.value) : "";
}

/** A stored URL is domain-only (see `UrlInput`); restore the scheme for links. */
export function withHttps(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function linkContact(kind: ContactKind): (value: string) => ContactView {
  return (value) => {
    const url = withHttps(value);
    return { kind, value: url, href: url };
  };
}

// Links show the full URL (scheme included): a bare domain isn't recognized as
// a link by résumé parsers, which look for http(s)://, www., or a path.
const CONTACT_VIEWS: Record<ContactKind, (value: string) => ContactView> = {
  phone: (value) => ({
    kind: "phone",
    value,
    href: `tel:${S.replaceByRe(value, /\s+/g, "")}`,
  }),
  email: (value) => ({ kind: "email", value, href: `mailto:${value}` }),
  website: linkContact("website"),
  linkedin: linkContact("linkedin"),
  link: linkContact("link"),
  location: (value) => ({ kind: "location", value }),
  birth: (value) => ({ kind: "birth", value }),
};

/** "28" reads as an age and gets its label; a date or phrase stays as typed. */
function birthLine(resume: Resume, value: string): string {
  if (!/^\d{1,3}$/.test(value)) return value;
  return `${RESUME_LABELS[resume.language].age}: ${value}`;
}

/** The QR code of the portfolio link, as an SVG data URL. */
function qrDataUrl(link: string): string {
  const svg = renderSVG(withHttps(link), { border: 1 });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function portfolioLink(resume: Resume): string {
  const fields = resume.header.fields;
  return plain(fields.website) || plain(fields.link);
}

export function isAtsMode(resume: Resume): boolean {
  return resume.atsMode ?? true;
}

/**
 * The header as the templates draw it. ATS mode blanks every design-only
 * element here, the single chokepoint: no photo, no icons, no QR code.
 */
export function toHeaderView(resume: Resume): HeaderView {
  const fields = resume.header.fields;
  const ats = isAtsMode(resume);
  const fullName = joinPresent(
    [plain(fields.firstName), plain(fields.lastName)],
    " ",
  );
  const location = joinPresent(
    [plain(fields.city), plain(fields.province), plain(fields.country)],
    ", ",
  );
  const birth = plain(fields.birthDate);
  const rawContacts: ReadonlyArray<readonly [ContactKind, string]> = [
    ["phone", plain(fields.phone)],
    ["email", plain(fields.email)],
    ["website", plain(fields.website)],
    ["linkedin", plain(fields.linkedin)],
    ["link", plain(fields.link)],
    ["location", location],
    ["birth", birth ? birthLine(resume, birth) : ""],
  ];
  const contacts = pipe(
    rawContacts,
    A.reject(([, value]) => S.isEmpty(value)),
    A.map(([kind, value]) => CONTACT_VIEWS[kind](value)),
  );
  const link = portfolioLink(resume);
  const showQr = !ats && resume.showQr === true && S.isNotEmpty(link);

  return {
    fullName,
    headline: plain(fields.jobTitle),
    photo: ats ? undefined : resume.header.photo,
    photoSize: resume.photoSize ?? 56,
    photoRadius: resume.photoRadius ?? 0,
    photoAlign: resume.photoAlign ?? "top",
    contacts,
    showIcons: !ats && (resume.showIcons ?? true),
    ...(showQr && { qr: qrDataUrl(link) }),
  };
}
