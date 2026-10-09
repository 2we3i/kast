import type { PropsWithChildren } from "react";
import { useResumeStore } from "@/lib/store";
import { usePreferencesStore } from "@/lib/store/preferences-store";

/**
 * Marks the fields inside as written in the résumé's language, so the
 * browser's spell checker (and screen readers) use the right dictionary,
 * whatever the interface language. Inputs and rich-text editors inherit both
 * the language and the spell-check setting from here.
 */
export function EditorLanguageScope(props: PropsWithChildren) {
  const language = useResumeStore((state) => state.open?.language);
  const spellcheck = usePreferencesStore((state) => state.spellcheck);

  return (
    <div lang={language} spellCheck={spellcheck}>
      {props.children}
    </div>
  );
}
