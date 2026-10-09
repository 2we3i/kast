export const EDITOR_PATHNAME = "/platform/editor";

type EditorHref = `${typeof EDITOR_PATHNAME}?id=${string}`;
type EditorTabHref = `${EditorHref}&tab=${string}`;

/**
 * Builds the editor address. Every link and redirect into the editor goes
 * through here. The site is static, so the id rides in a search param: there
 * is no page per user-generated id.
 */
export function editorHref(id: string): EditorHref {
  return `${EDITOR_PATHNAME}?id=${id}`;
}

/** The editor opened on one sidebar tab, e.g. the AI results to review. */
export function editorTabHref(id: string, tab: string): EditorTabHref {
  return `${editorHref(id)}&tab=${tab}`;
}

/** Where the brand mark leads: the landing page. */
export function homeHref(): "/" {
  return "/";
}
