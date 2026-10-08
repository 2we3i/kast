import { A, pipe } from "@mobily/ts-belt";
import type { CSSProperties } from "react";
import { FONTS, resolveFont } from "@/lib/fonts";
import {
  TEMPLATE_ACCENT,
  TEMPLATE_LINE_HEIGHT,
  type TemplateId,
} from "@/lib/templates";
import type { ResumePreview } from "./resume-preview";

type TypographySlice = Pick<
  ResumePreview,
  | "atsMode"
  | "accent"
  | "font"
  | "letterSpacing"
  | "lineHeight"
  | "nameScale"
  | "titleScale"
  | "bodyScale"
>;

/**
 * Inline style scoping the résumé's typography to a preview subtree.
 *
 * Fonts are CSS variables: with no override the template defaults apply (Inter
 * sans, Lora serif, GeistMono mono, matching the PDF registrations); an
 * override points all three slots at the chosen family. Always set from the
 * self-hosted faces so the preview matches the PDF export exactly.
 *
 * Letter spacing inherits natively. Line height is always resolved (the
 * document value, else the template baseline) and carried by the inheriting
 * `--resume-line-height` variable that the rich-text body's leading consumes
 * (Tailwind's `--tw-leading` is registered non-inheriting, so it can't carry
 * a document-wide value); this keeps the on-screen body rhythm identical to
 * the PDF page's. Single-line accents (names, headings, dates) keep their
 * size-specific leading, mirroring the PDF's explicit per-element styles.
 */
export function resumeTypographyStyle(
  resume: TypographySlice,
  template: TemplateId,
): CSSProperties {
  const override = resolveFont(resume.font ?? undefined);
  const lineHeight = resume.lineHeight ?? TEMPLATE_LINE_HEIGHT[template];
  const accent = resolveResumeAccent(resume, template);
  // Per-group font-size multipliers; the resume-<group>-* utilities multiply
  // each element's baseline size by these (default 1 via the class fallback).
  return {
    "--font-sans": `${override?.family ?? "Inter"}, ui-sans-serif, system-ui, sans-serif`,
    "--font-serif": `${override?.family ?? "Lora"}, ui-serif, Georgia, serif`,
    "--font-geist-mono": `${override?.family ?? "GeistMono"}, ui-monospace, monospace`,
    lineHeight,
    "--resume-line-height": String(lineHeight),
    "--resume-accent": accent,
    "--resume-accent-soft": tint(accent, 0.9),
    ...(resume.letterSpacing !== 0 && {
      letterSpacing: `${resume.letterSpacing}px`,
    }),
    ...(resume.nameScale !== 1 && { "--resume-name-scale": resume.nameScale }),
    ...(resume.titleScale !== 1 && {
      "--resume-title-scale": resume.titleScale,
    }),
    ...(resume.bodyScale !== 1 && { "--resume-body-scale": resume.bodyScale }),
  } as CSSProperties;
}

/** Ink, the color every template draws in ATS mode. */
const INK = "#0a0a0a";

/**
 * The accent the templates draw with: ink in ATS mode, otherwise the user's
 * pick or the template's own. Always a literal hex, never a nested var(),
 * which the PDF renderer cannot resolve.
 */
export function resolveResumeAccent(
  resume: Pick<ResumePreview, "atsMode" | "accent">,
  template: TemplateId,
): string {
  if (resume.atsMode) return INK;
  return resume.accent ?? TEMPLATE_ACCENT[template];
}

/** Mixes a #rrggbb color toward white by `amount` (0..1), as #rrggbb. */
export function tint(hex: string, amount: number): string {
  const channel = (offset: number) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16);
    const mixed = Math.round(value + (255 - value) * amount);
    return mixed.toString(16).padStart(2, "0");
  };
  return `#${channel(1)}${channel(3)}${channel(5)}`;
}

const FONT_FACE_CSS = pipe(
  FONTS,
  A.flatMap((font) =>
    A.map(
      font.faces,
      (face) =>
        `@font-face{font-family:"${font.family}";src:url("/fonts/${face.file}") format("truetype");font-weight:${face.weight};font-style:${face.style};font-display:swap;}`,
    ),
  ),
  A.join("\n"),
);

/**
 * Declares every catalog face once. Declarations are free: a browser only
 * downloads a face when rendered text actually uses its family, so the whole
 * catalog can be declared while only the selected font is fetched. React
 * hoists and dedupes the tag by `href`, so it can be rendered by both the
 * editor preview and every thumbnail.
 */
export function ResumeFontFaces() {
  return (
    <style href="resume-font-faces" precedence="low">
      {FONT_FACE_CSS}
    </style>
  );
}
