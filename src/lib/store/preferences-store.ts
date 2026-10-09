import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface PreferencesState {
  /** Whether the browser checks spelling in the editor's fields. */
  spellcheck: boolean;
  setSpellcheck: (spellcheck: boolean) => void;
}

/** Per-browser editor preferences that are not part of any résumé. */
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      spellcheck: true,
      setSpellcheck: (spellcheck) => set({ spellcheck }),
    }),
    {
      name: "kast:preferences",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
