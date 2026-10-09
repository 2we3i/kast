import { A, O } from "@mobily/ts-belt";
import {
  EnvelopeSimpleIcon,
  type Icon,
  ListBulletsIcon,
  PaletteIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparkleIcon,
} from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { type EditorTab, useEditorChromeStore } from "@/lib/store";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { EditorAiPanel } from "./editor-ai/editor-ai-panel";
import { EditorAtsPanel } from "./editor-ats/editor-ats-panel";
import { EditorDocumentPanel } from "./editor-document-panel";
import { EditorImportLeftovers } from "./editor-import-leftovers";
import { EditorLanguageScope } from "./editor-language-scope";
import { EditorLayoutTemplateList } from "./editor-layout/ed-layout-template-list";
import { EditorLetterPanel } from "./editor-letter/editor-letter-panel";
import { EditorSectionList } from "./editor-sections/ed-section-list";
import { EditorSectionOrderReset } from "./editor-sections/ed-section-order-reset";
import { EditorUndoRedo } from "./editor-undo-redo";

interface TabDescriptor {
  value: EditorTab;
  labelKey: string;
  icon: Icon;
  id: string;
}

const TABS: ReadonlyArray<TabDescriptor> = [
  {
    value: "editor",
    labelKey: "tabEditor",
    icon: ListBulletsIcon,
    id: "tour-editor-tab",
  },
  {
    value: "layout",
    labelKey: "tabLayout",
    icon: PaletteIcon,
    id: "tour-layout-tab",
  },
  {
    value: "document",
    labelKey: "tabDocument",
    icon: SlidersHorizontalIcon,
    id: "tour-document-tab",
  },
  {
    value: "check",
    labelKey: "tabCheck",
    icon: ShieldCheckIcon,
    id: "tour-check-tab",
  },
  { value: "ai", labelKey: "tabAi", icon: SparkleIcon, id: "tour-ai-tab" },
  {
    value: "letter",
    labelKey: "tabLetter",
    icon: EnvelopeSimpleIcon,
    id: "tour-letter-tab",
  },
];

const PANEL_HEIGHT = "h-[calc(100vh-9.5rem)]";

export function EditorSidebarContent() {
  const t = useTranslations("editor.chrome");
  const tab = useEditorChromeStore((state) => state.activeTab);
  const setActiveTab = useEditorChromeStore((state) => state.setActiveTab);

  const onTabChange = (next: string) => setActiveTab(next as EditorTab);

  return (
    <div className="flex flex-col py-4">
      <EditorImportLeftovers />

      <Tabs value={tab} onValueChange={onTabChange}>
        <div className="flex shrink-0 items-center justify-between gap-2 px-4">
          <h2 className="text-sm font-medium">
            {t(
              O.mapWithDefault(
                A.find(TABS, (item) => item.value === tab),
                "tabEditor",
                (item) => item.labelKey,
              ),
            )}
          </h2>
          <EditorUndoRedo />
        </div>
        <div className="px-4 pt-2">
          <TabsList className="grid h-auto w-full grid-cols-6">
            {TABS.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                id={item.id}
                aria-label={t(item.labelKey)}
                title={t(item.labelKey)}
                className="flex-col gap-0.5 px-1 py-1.5 text-[0.6875rem]"
              >
                <item.icon className="size-4" />
                <span className="max-w-full truncate">{t(item.labelKey)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="editor">
          <ScrollArea id="tour-editor-sections" className={PANEL_HEIGHT}>
            <div className="flex items-center justify-end px-4 pt-4">
              <h3 className="text-sm font-medium sr-only">
                {t("sectionsHeading")}
              </h3>
              <EditorSectionOrderReset />
            </div>
            <EditorLanguageScope>
              <EditorSectionList />
            </EditorLanguageScope>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="layout">
          <ScrollArea id="tour-editor-layout" className={PANEL_HEIGHT}>
            <EditorLayoutTemplateList />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="document">
          <ScrollArea id="tour-editor-document" className={PANEL_HEIGHT}>
            <EditorDocumentPanel />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="check">
          <ScrollArea id="tour-editor-check" className={PANEL_HEIGHT}>
            <EditorAtsPanel />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="ai">
          <ScrollArea id="tour-editor-ai" className={PANEL_HEIGHT}>
            <EditorAiPanel />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="letter">
          <ScrollArea id="tour-editor-letter" className={PANEL_HEIGHT}>
            <EditorLanguageScope>
              <EditorLetterPanel />
            </EditorLanguageScope>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
