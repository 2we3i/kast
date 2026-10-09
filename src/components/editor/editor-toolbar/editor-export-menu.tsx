import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
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
import { Spinner } from "@/components/ui/spinner";
import { useResumeDownload } from "@/hooks/use-resume-download";
import {
  EXPORT_EXTENSIONS,
  EXPORT_LABELS,
  type ExportFormat,
} from "../export-format";

const DOCUMENT_FORMATS: ReadonlyArray<ExportFormat> = ["pdf", "docx", "txt"];
const DATA_FORMATS: ReadonlyArray<ExportFormat> = [
  "json",
  "yaml",
  "europass-xml",
  "europass-json",
];

/** One-click export of the open résumé, named after its title. */
export function EditorExportMenu() {
  const { resume, generating, download } = useResumeDownload();
  const t = useTranslations("editor.export");
  if (!resume) return null;

  async function run(format: ExportFormat) {
    const saved = await download(format, resume?.title || "resume");
    if (!saved) toast.error(t("failed"));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button size="sm" id="tour-export" disabled={generating} />}
      >
        {generating ? <Spinner /> : <DownloadSimpleIcon />} {t("open")}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("documents")}</DropdownMenuLabel>
          {DOCUMENT_FORMATS.map((format) => (
            <DropdownMenuItem key={format} onClick={() => void run(format)}>
              {EXPORT_LABELS[format]}
              <span className="ml-auto text-xs text-muted-foreground">
                {t(`hints.${format}`)}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("data")}</DropdownMenuLabel>
          {DATA_FORMATS.map((format) => (
            <DropdownMenuItem key={format} onClick={() => void run(format)}>
              {EXPORT_LABELS[format]}
              <span className="ml-auto text-xs text-muted-foreground">
                .{EXPORT_EXTENSIONS[format]}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
