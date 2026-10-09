import { create } from "zustand";

/** The editor sidebar's tabs, in display order. */
export type EditorTab =
  | "editor"
  | "layout"
  | "document"
  | "check"
  | "ai"
  | "letter";

/**
 * Imperative control over the editor's sidebar chrome: which tab is active and,
 * on small screens, whether the editing sheet is open. Held in a store (rather
 * than component-local nuqs/useState) so the guided tour can drive both as it
 * walks the tabs, mirroring how `useSidebarStore.ensureVisible` lets the tour
 * open the platform sidebar.
 */
interface EditorChromeState {
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
  /** Only meaningful below xl, where the sidebar renders as a sheet. */
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
  /**
   * The section accordion's open items: section ids for custom and optional
   * sections, section types for the rest. Kept here so the ATS and AI panels
   * can send the user straight to the section an issue is about.
   */
  openSections: string[];
  setOpenSections: (open: string[]) => void;
  /** Switch to the content tab with one section open. */
  revealSection: (value: string) => void;
  /** Pages the paginated preview currently fills; 0 before the first measure. */
  pageCount: number;
  setPageCount: (count: number) => void;
}

export const useEditorChromeStore = create<EditorChromeState>()((set) => ({
  activeTab: "editor",
  setActiveTab: (activeTab) => set({ activeTab }),
  sheetOpen: false,
  setSheetOpen: (sheetOpen) => set({ sheetOpen }),
  openSections: [],
  setOpenSections: (openSections) => set({ openSections }),
  revealSection: (value) =>
    set({ activeTab: "editor", openSections: [value], sheetOpen: true }),
  pageCount: 0,
  setPageCount: (pageCount) => set({ pageCount }),
}));
