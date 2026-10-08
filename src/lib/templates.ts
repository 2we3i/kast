import { A, G, pipe, S } from "@mobily/ts-belt";

/**
 * The catalog of résumé templates shown on the Templates page. Presentation
 * metadata only; the rendering for each template lives under
 * `@/components/editor/templates`. Every template has an ATS-safe mode and a
 * design mode; the document's `atsMode` flag picks between them.
 */
export type TemplateId =
  | "standard"
  | "compact"
  | "airy"
  | "bold"
  | "classic"
  | "mono"
  | "modern"
  | "elegant"
  | "timeline"
  | "executive";

export const DEFAULT_TEMPLATE_ID: TemplateId = "standard";

export interface TemplateSummary {
  id: TemplateId;
  name: string;
  description?: string;
  /** ISO 8601: when the template was added, for "newest" sorting. */
  addedAt: string;
}

/** Coerces a persisted template id to a known one, falling back to the default. */
export function resolveTemplateId(id: string): TemplateId {
  if (A.some(TEMPLATES, (template) => template.id === id)) {
    return id as TemplateId;
  }
  return DEFAULT_TEMPLATE_ID;
}

/**
 * Each template's baseline body line height. The editor's line-height slider
 * rests here, and the preview body renders it; the PDF is drawn from the same
 * HTML, so it matches.
 */
export const TEMPLATE_LINE_HEIGHT: Record<TemplateId, number> = {
  standard: 1.4,
  compact: 1.35,
  airy: 1.5,
  bold: 1.4,
  classic: 1.45,
  mono: 1.4,
  modern: 1.45,
  elegant: 1.5,
  timeline: 1.4,
  executive: 1.4,
};

/**
 * Each template's own accent for design mode, used until the user picks one.
 * ATS mode draws every template in ink.
 */
export const TEMPLATE_ACCENT: Record<TemplateId, string> = {
  standard: "#1e1b4b",
  compact: "#1e3a5f",
  airy: "#475569",
  bold: "#111827",
  classic: "#5b3a1e",
  mono: "#0f766e",
  modern: "#4338ca",
  elegant: "#9a3412",
  timeline: "#0e7490",
  executive: "#1e1b4b",
};

/** Accent swatches offered in the design panel, after the template's own. */
export const ACCENT_SWATCHES: ReadonlyArray<string> = [
  "#1e1b4b",
  "#4338ca",
  "#0e7490",
  "#0f766e",
  "#15803d",
  "#b45309",
  "#b91c1c",
  "#be185d",
  "#475569",
  "#111827",
];

/** Templates whose headers draw contact icon glyphs (in design mode). */
const TEMPLATE_IDS_WITH_CONTACT_ICONS: TemplateId[] = [
  "standard",
  "compact",
  "bold",
  "modern",
  "timeline",
  "executive",
];

/** Whether a persisted template id renders contact icons. Unknown ids resolve to the default template first, matching renderer fallback. */
export function templateHasContactIcons(id: string): boolean {
  return A.includes(TEMPLATE_IDS_WITH_CONTACT_ICONS, resolveTemplateId(id));
}

export type TemplateSort = "name-asc" | "name-desc" | "newest";

export const TEMPLATE_SORTS: TemplateSort[] = [
  "name-asc",
  "name-desc",
  "newest",
];

/** Shared by the Templates page and the create dialog, so both list templates in the same order. */
export const DEFAULT_TEMPLATE_SORT: TemplateSort = "name-asc";

export const TEMPLATES: TemplateSummary[] = [
  { id: "standard", name: "Standard", addedAt: "2026-10-01T00:00:00.000Z" },
  { id: "compact", name: "Compact", addedAt: "2026-10-01T00:00:00.000Z" },
  { id: "airy", name: "Airy", addedAt: "2026-10-01T00:00:00.000Z" },
  { id: "bold", name: "Bold", addedAt: "2026-10-01T00:00:00.000Z" },
  { id: "classic", name: "Classic", addedAt: "2026-10-01T00:00:00.000Z" },
  { id: "mono", name: "Mono", addedAt: "2026-10-01T00:00:00.000Z" },
  { id: "modern", name: "Modern", addedAt: "2026-10-08T00:00:00.000Z" },
  { id: "elegant", name: "Elegant", addedAt: "2026-10-08T00:00:00.000Z" },
  { id: "timeline", name: "Timeline", addedAt: "2026-10-08T00:00:00.000Z" },
  { id: "executive", name: "Executive", addedAt: "2026-10-08T00:00:00.000Z" },
];

export function filterTemplates(
  templates: ReadonlyArray<TemplateSummary>,
  query: string,
): ReadonlyArray<TemplateSummary> {
  const needle = pipe(query, S.trim, S.toLowerCase);
  if (!needle) return templates;
  return A.filter(
    templates,
    (template) =>
      S.includes(S.toLowerCase(template.name), needle) ||
      (G.isString(template.description) &&
        S.includes(S.toLowerCase(template.description), needle)),
  );
}

/**
 * The catalog in the default browse order. Every template grid renders this
 * list so the surfaces can never drift apart; only the Templates page
 * re-sorts, and only when the user picks another sort.
 */
export const SORTED_TEMPLATES: ReadonlyArray<TemplateSummary> = sortTemplates(
  TEMPLATES,
  DEFAULT_TEMPLATE_SORT,
);

export function sortTemplates(
  templates: ReadonlyArray<TemplateSummary>,
  sort: TemplateSort,
): ReadonlyArray<TemplateSummary> {
  switch (sort) {
    case "name-asc":
      return A.sort(templates, (a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return A.sort(templates, (a, b) => b.name.localeCompare(a.name));
    case "newest":
      return A.sort(templates, (a, b) => b.addedAt.localeCompare(a.addedAt));
  }
}
