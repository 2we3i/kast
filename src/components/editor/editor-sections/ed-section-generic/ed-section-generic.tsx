import { A, O } from "@mobily/ts-belt";
import { DotsThreeVerticalIcon, TrashIcon } from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useResumeStore } from "@/lib/store";
import { EditorSectionVisibility } from "../ed-section-visibility";
import { SECTION_ICONS } from "../section-icons";
import { GenericForm } from "./generic-form";

interface EditorSectionGenericProps {
  sectionId: string;
}

/** The accordion row of an optional section: title, visibility, remove. */
export function EditorSectionGeneric(props: EditorSectionGenericProps) {
  const section = useResumeStore((state) =>
    A.find(state.open?.sections ?? [], (s) => s.id === props.sectionId),
  );
  const removeSection = useResumeStore((state) => state.removeSection);
  const t = useTranslations("editor.generic");

  if (O.isNone(section)) return null;
  const Icon = SECTION_ICONS[section.type];

  return (
    <AccordionItem value={section.id} className="relative">
      <AccordionTrigger className="min-w-0 items-center gap-3">
        <Icon className="size-4 shrink-0" />
        <span className="mr-20 min-w-0 flex-1 truncate text-left">
          {t(`titles.${section.type}`)}
        </span>
      </AccordionTrigger>

      <div className="absolute top-2.5 right-9 z-10 flex items-center gap-1">
        <EditorSectionVisibility sectionId={section.id} className="static" />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button size="icon-sm" variant="ghost" />}
          >
            <span className="sr-only">{t("menuLabel")}</span>
            <DotsThreeVerticalIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => removeSection(section.id)}
            >
              <TrashIcon /> {t("removeSection")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AccordionContent>
        <GenericForm sectionId={section.id} />
      </AccordionContent>
    </AccordionItem>
  );
}
