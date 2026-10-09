import { z } from "zod";
import { EXPORT_FORMATS } from "@/components/editor/export-format";

type Translator = (key: string) => string;

export function createDownloadFileSchema(t: Translator) {
  return z.object({
    format: z.enum(EXPORT_FORMATS),
    fileName: z.string().trim().min(1, t("fileNameRequired")),
  });
}

export type DownloadFileForm = z.infer<
  ReturnType<typeof createDownloadFileSchema>
>;
