export const EDITOR_PATHNAME = "/platform/editor";

type EditorHref = `${typeof EDITOR_PATHNAME}?id=${string}`;

/**
 * Builds the editor address. Every link and redirect into the editor goes
 * through here. The site is static, so the id rides in a search param: there
 * is no page per user-generated id.
 */
export function editorHref(id: string): EditorHref {
  return `${EDITOR_PATHNAME}?id=${id}`;
}

/** Where the brand mark leads: the landing page. */
export function homeHref(): "/" {
  return "/";
}
