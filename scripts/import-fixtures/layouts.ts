import { type FixtureResume, HEADINGS } from "./fixture-content";
import { PAGE, type Writer } from "./render";

/**
 * Page layouts the import must read, modelled on what job portals and
 * résumé builders export: a label column beside the content (CV.lt style),
 * one column in two variants, and a sidebar on either side.
 */

const LABEL_RIGHT = 186;
const CONTENT_X = 196;
const CONTENT_WIDTH = 360;
const LEFT_X = 86;

function heading(w: Writer, text: string, x = LEFT_X): void {
  w.ensure(40);
  w.gap(14);
  w.text(text, x, { size: 11, bold: true });
  w.gap(22);
}

/** CV.lt-like: dates, tenure, and names in a right-aligned label column. */
export function labelsLayout(w: Writer, r: FixtureResume): void {
  const h = HEADINGS[r.lang];
  const headerTop = w.top;
  w.gap(70);
  w.text(h.summary ?? "", LEFT_X + 4, { size: 8 });
  w.gap(18);
  w.paragraph(r.summary, LEFT_X, 420, { size: 8 });
  if (r.salary) {
    w.gap(8);
    w.text(h.salary ?? "", LEFT_X + 4, { size: 8 });
    w.gap(18);
    w.text(r.salary, LEFT_X, { size: 8 });
    w.gap(12);
  }
  if (r.availability) {
    w.gap(8);
    w.text(h.availability ?? "", LEFT_X + 4, { size: 8 });
    w.gap(18);
    w.text(r.availability, LEFT_X, { size: 8 });
    w.gap(12);
  }
  heading(w, h.experience ?? "");
  for (const job of r.jobs) {
    w.ensure(80);
    w.textRight(job.dates, LABEL_RIGHT, { size: 8 });
    w.text(
      job.site ? `${job.company}  ${job.site}` : job.company,
      CONTENT_X + 14,
      { size: 8 },
    );
    w.gap(17);
    if (job.duration) w.textRight(job.duration, LABEL_RIGHT, { size: 8 });
    w.text(job.title, CONTENT_X + 10, { size: 10, bold: true });
    w.gap(15);
    w.paragraph(job.bullets.join(" "), CONTENT_X, CONTENT_WIDTH, { size: 8 });
    w.gap(10);
  }
  heading(w, h.education ?? "");
  for (const school of r.schools) {
    w.ensure(50);
    w.textRight(school.dates, LABEL_RIGHT, { size: 8 });
    w.text(school.school, CONTENT_X + 14, { size: 8 });
    w.gap(17);
    w.text(school.degree, CONTENT_X + 10, { size: 10, bold: true });
    w.gap(20);
  }
  heading(w, h.languages ?? "");
  for (const language of r.languages) {
    w.ensure(70);
    w.textRight(language.name, LABEL_RIGHT, { size: 8, bold: true });
    const [speak, understand, write] = language.skills ?? ["", "", ""];
    for (const [label, value] of [
      [h.speaking, speak],
      [h.understanding, understand],
      [h.writing, write],
    ] as const) {
      w.text(label ?? "", CONTENT_X, { size: 8 });
      w.text(value, CONTENT_X + 116, { size: 8 });
      w.gap(20);
    }
    w.gap(10);
  }
  heading(w, h.skills ?? "");
  for (const skill of r.skills) {
    w.ensure(50);
    w.textRight(skill.name, LABEL_RIGHT, { size: 8, bold: true });
    w.text(h.level ?? "", CONTENT_X, { size: 8 });
    w.text(skill.level, CONTENT_X + 82, { size: 8 });
    w.gap(20);
    if (skill.description) {
      w.paragraph(skill.description, CONTENT_X, CONTENT_WIDTH, { size: 8 });
    }
    w.gap(12);
  }
  if (r.references?.length) {
    heading(w, h.references ?? "");
    for (const ref of r.references) {
      w.ensure(60);
      w.textRight(ref.company, LABEL_RIGHT, { size: 8 });
      w.text(`${ref.position} | ${ref.name}`, CONTENT_X, {
        size: 8,
        bold: true,
      });
      w.gap(12);
      w.text(ref.phone, CONTENT_X, { size: 8 });
      w.gap(12);
      w.text(ref.email, CONTENT_X, { size: 8 });
      w.gap(22);
    }
  }
  if (r.driving || r.interests)
    heading(
      w,
      r.lang === "lt"
        ? "Kita informacija"
        : r.lang === "ru"
          ? "Дополнительная информация"
          : "Other information",
    );
  if (r.driving) {
    w.textRight(h.driving ?? "", LABEL_RIGHT, { size: 8 });
    w.text(r.driving, CONTENT_X, { size: 8 });
    w.gap(20);
  }
  if (r.interests) {
    w.textRight(h.interests ?? "", LABEL_RIGHT, { size: 8 });
    w.paragraph(r.interests, CONTENT_X, CONTENT_WIDTH, { size: 8 });
  }
  // The header is drawn last, as some portals emit it: stream order must not matter.
  const first = w.pages[0];
  if (first) {
    w.text(r.name, LEFT_X, { size: 14, top: headerTop, page: first });
    w.text(r.city, LEFT_X + 130, { size: 8, top: headerTop, page: first });
    w.text(r.phone, LEFT_X + 10, { size: 8, top: headerTop + 16, page: first });
    w.text(r.email, LEFT_X + 10, { size: 8, top: headerTop + 28, page: first });
  }
}

interface SingleOptions {
  /** "a": title and dates on one line; "b": title, then "Company | City | dates". */
  variant: "a" | "b";
  bullets: boolean;
  size?: number;
}

/** One column, top to bottom. */
export function singleLayout(
  w: Writer,
  r: FixtureResume,
  options: SingleOptions,
): void {
  const h = HEADINGS[r.lang];
  const size = options.size ?? 9.5;
  const x = 56;
  const width = PAGE.width - 2 * x;
  w.text(r.name, x, { size: 20, bold: true });
  w.gap(24);
  w.text(r.headline, x, { size: 11 });
  w.gap(16);
  w.text(`${r.email}  ·  ${r.phone}  ·  ${r.city}`, x, { size });
  w.gap(10);
  const section = (title: string) => {
    w.ensure(40);
    w.gap(14);
    w.text(title.toUpperCase(), x, { size: 11.5, bold: true });
    w.gap(18);
  };
  section(h.summary ?? "");
  w.paragraph(r.summary, x, width, { size });
  section(h.experience ?? "");
  for (const job of r.jobs) {
    w.ensure(70);
    if (options.variant === "a") {
      w.text(job.title, x, { size: size + 1, bold: true });
      w.textRight(job.dates, x + width, { size });
      w.gap(size * 1.5);
      w.text(job.company, x, { size });
      w.gap(size * 1.5);
    } else {
      w.text(job.title, x, { size: size + 1, bold: true });
      w.gap(size * 1.5);
      w.text(`${job.company} | ${r.city} | ${job.dates}`, x, { size });
      w.gap(size * 1.5);
    }
    if (options.bullets) {
      for (const bullet of job.bullets)
        w.paragraph(`• ${bullet}`, x + 6, width - 6, { size });
    } else {
      w.paragraph(job.bullets.join(" "), x, width, { size });
    }
    w.gap(8);
  }
  section(h.education ?? "");
  for (const school of r.schools) {
    w.ensure(40);
    w.text(school.degree, x, { size: size + 1, bold: true });
    w.textRight(school.dates, x + width, { size });
    w.gap(size * 1.5);
    w.text(school.school, x, { size });
    w.gap(size * 2);
  }
  section(h.skills ?? "");
  w.paragraph(
    r.skills.map((skill) => `${skill.name} — ${skill.level}`).join(", "),
    x,
    width,
    { size },
  );
  section(h.languages ?? "");
  for (const language of r.languages) {
    w.text(
      `${language.name} — ${language.level || language.skills?.[0] || ""}`,
      x,
      { size },
    );
    w.gap(size * 1.5);
  }
}

/** A sidebar beside the main column, drawn after it in the content stream. */
export function sidebarLayout(
  w: Writer,
  r: FixtureResume,
  side: "left" | "right",
): void {
  const h = HEADINGS[r.lang];
  const mainX = side === "left" ? 220 : 50;
  const mainWidth = 320;
  const sideX = side === "left" ? 40 : 410;
  const sideWidth = 140;
  const first = w.page;
  w.text(r.name, mainX, { size: 20, bold: true });
  w.gap(24);
  w.text(r.headline, mainX, { size: 11 });
  w.gap(20);
  const section = (title: string) => {
    w.ensure(40);
    w.gap(10);
    w.text(title, mainX, { size: 12, bold: true });
    w.gap(18);
  };
  section(h.summary ?? "");
  w.paragraph(r.summary, mainX, mainWidth, { size: 9 });
  section(h.experience ?? "");
  for (const job of r.jobs) {
    w.ensure(70);
    w.text(job.title, mainX, { size: 10, bold: true });
    w.gap(13);
    w.text(job.company, mainX, { size: 9 });
    w.gap(12);
    w.text(job.dates, mainX, { size: 8.5 });
    w.gap(13);
    for (const bullet of job.bullets)
      w.paragraph(`• ${bullet}`, mainX, mainWidth, { size: 9 });
    w.gap(8);
  }
  section(h.education ?? "");
  for (const school of r.schools) {
    w.text(school.degree, mainX, { size: 10, bold: true });
    w.gap(13);
    w.text(school.school, mainX, { size: 9 });
    w.gap(12);
    w.text(school.dates, mainX, { size: 8.5 });
    w.gap(16);
  }
  // The sidebar comes last in the stream, though it sits beside the top.
  let top = 140;
  const sideText = (value: string, bold = false, size = 9) => {
    w.text(value, sideX, { size, bold, top, page: first });
    top += size * 1.5;
  };
  sideText(r.email, false, 8);
  sideText(r.phone, false, 8);
  sideText(r.city, false, 8);
  top += 14;
  sideText(h.skills ?? "", true, 12);
  top += 4;
  for (const skill of r.skills) sideText(`${skill.name} — ${skill.level}`);
  top += 14;
  sideText(h.languages ?? "", true, 12);
  top += 4;
  for (const language of r.languages) {
    sideText(
      `${language.name} — ${language.level || language.skills?.[0] || ""}`,
    );
  }
  void sideWidth;
}
