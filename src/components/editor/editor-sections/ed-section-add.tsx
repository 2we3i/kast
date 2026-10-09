import { A } from "@mobily/ts-belt";
import { PlusIcon, ShapesIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OPTIONAL_SECTION_TYPES } from "@/lib/resume/schema-registry";
import { useResumeStore } from "@/lib/store";
import { EditorSectionCustomNameDialog } from "./ed-section-custom/ed-section-custom-name-dialog";
import { SECTION_ICONS } from "./section-icons";

interface EditorSectionAddProps {
  /** Called with the new section's id so the list can open it. */
  onAdded: (id: string) => void;
}

/**
 * Adds a section: one of the optional types not yet in the document, or a
 * custom section with a heading of the user's choosing.
 */
export function EditorSectionAdd(props: EditorSectionAddProps) {
  const present = useResumeStore((state) =>
    A.map(state.open?.sections ?? [], (section) => section.type),
  );
  const addOptionalSection = useResumeStore(
    (state) => state.addOptionalSection,
  );
  const addCustomSection = useResumeStore((state) => state.addCustomSection);
  const t = useTranslations("editor.chrome");
  const tg = useTranslations("editor.generic");
  const tc = useTranslations("editor.custom");
  const [customOpen, setCustomOpen] = useState(false);
  const available = A.reject(OPTIONAL_SECTION_TYPES, (type) =>
    A.includes(present, type),
  );

  return (
    <div className="px-4 pt-4">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="w-full"
              id="tour-add-section"
            />
          }
        >
          <PlusIcon /> {t("addSection")}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-64">
          {A.isNotEmpty(available) && (
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t("addSectionLabel")}</DropdownMenuLabel>
              {available.map((type) => {
                const Icon = SECTION_ICONS[type];
                return (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => props.onAdded(addOptionalSection(type))}
                  >
                    <Icon /> {tg(`titles.${type}`)}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          )}
          {A.isNotEmpty(available) && <DropdownMenuSeparator />}
          <DropdownMenuItem onClick={() => setCustomOpen(true)}>
            <ShapesIcon /> {t("addCustomSection")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditorSectionCustomNameDialog
        open={customOpen}
        onOpenChange={setCustomOpen}
        heading={tc("addHeading")}
        description={tc("addDescription")}
        initialValue=""
        onSubmit={(title) => props.onAdded(addCustomSection(title))}
      />
    </div>
  );
}
