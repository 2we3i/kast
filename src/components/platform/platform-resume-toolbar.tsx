import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { useResumeCreateDialog } from "@/hooks/use-resume-create-dialog";
import { useResumeSearchQuery } from "@/hooks/use-resume-search";
import { Button } from "../ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import { PlatformAiBatchDialog } from "./platform-ai-batch/platform-ai-batch-dialog";
import { PlatformResumeCreateDialog } from "./platform-resume-create-dialog";
import { PlatformResumeStatusFilter } from "./platform-resume-status-filter";

export function PlatformResumeToolbar() {
  const [open, setOpen] = useResumeCreateDialog();
  const [query, setQuery] = useResumeSearchQuery();
  const t = useTranslations("platform.toolbar");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup
        id="tour-search-resume"
        className="max-w-xs min-w-40 flex-1 basis-48"
      >
        <InputGroupAddon>
          <MagnifyingGlassIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("searchResume")}
        />
      </InputGroup>
      <PlatformResumeStatusFilter />

      <nav className="ml-auto inline-flex flex-wrap items-center gap-2">
        <PlatformAiBatchDialog />
        <Button id="tour-create-resume" onClick={() => setOpen(true)}>
          <PlusIcon /> {t("resume")}
        </Button>
      </nav>

      <PlatformResumeCreateDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
