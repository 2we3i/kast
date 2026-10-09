import { EditorExportMenu } from "./editor-export-menu";
import { EditorStats } from "./editor-stats";
import { EditorTargetButton } from "./editor-target-dialog";
import { EditorVersions } from "./editor-versions";

/**
 * The bar over the paper preview: the vacancy this version is for, its size,
 * its history, and export.
 */
export function EditorToolbar() {
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b bg-background/85 px-4 py-2 backdrop-blur">
      <EditorTargetButton />
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <EditorStats />
        <EditorVersions />
        <EditorExportMenu />
      </div>
    </div>
  );
}
