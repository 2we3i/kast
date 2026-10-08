import { createContext, use } from "react";

/**
 * The document's presentation mode, for templates whose design-mode layout
 * differs in structure (not only color) from their ATS-safe one. Provided by
 * every renderer: the paginated preview, thumbnails, and the PDF flow.
 */
export interface ResumeMode {
  atsMode: boolean;
}

export const ResumeModeContext = createContext<ResumeMode>({ atsMode: true });

export function useResumeMode(): ResumeMode {
  return use(ResumeModeContext);
}
