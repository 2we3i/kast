import { create } from "zustand";

// Must match MOBILE_BREAKPOINT in hooks/use-mobile.ts; below it the sidebar
// renders as a sheet controlled via `mobileControl`, not `open`.
const MOBILE_QUERY = "(max-width: 767px)";

/** Holds `expanded` or `collapsed`. The head script in src/scripts/preferences.js reads it. */
export const SIDEBAR_STATE_KEY = "kast:sidebar-state";

/**
 * Saves the sidebar state where the head script finds it on the next page
 * load, and marks it on <html> for the pre-hydration CSS in globals.css.
 */
function saveSidebarState(open: boolean) {
  const state = open ? "expanded" : "collapsed";
  document.documentElement.dataset.sidebar = state;
  try {
    localStorage.setItem(SIDEBAR_STATE_KEY, state);
  } catch {
    // Storage can be blocked. The sidebar still works for this page.
  }
}

interface SidebarStoreState {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Takes the state the head script read from storage. */
  restoreOpen: () => void;
  mobileControl: ((open: boolean) => void) | null;
  registerMobileControl: (control: ((open: boolean) => void) | null) => void;
  ensureVisible: (visible: boolean) => void;
}

export const useSidebarStore = create<SidebarStoreState>()((set, get) => ({
  open: true,
  setOpen: (open) => {
    set({ open });
    saveSidebarState(open);
  },
  restoreOpen: () =>
    set({ open: document.documentElement.dataset.sidebar !== "collapsed" }),
  mobileControl: null,
  registerMobileControl: (control) => set({ mobileControl: control }),
  ensureVisible: (visible) => {
    if (window.matchMedia(MOBILE_QUERY).matches) {
      get().mobileControl?.(visible);
      return;
    }
    if (visible) get().setOpen(true);
  },
}));
