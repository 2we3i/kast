import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect } from "react";
import { type EditorTab, useEditorChromeStore } from "@/lib/store";

const TABS: ReadonlyArray<EditorTab> = [
  "editor",
  "layout",
  "document",
  "check",
  "ai",
  "letter",
];

/**
 * Opens the sidebar tab named in the `tab` search param once, then drops the
 * param, so a link can land the user on, say, the AI results to review.
 */
export function useEditorTabParam(): void {
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS));
  useEffect(() => {
    if (!tab) return;
    useEditorChromeStore.getState().setActiveTab(tab);
    void setTab(null);
  }, [tab, setTab]);
}
