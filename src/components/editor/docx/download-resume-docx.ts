import { Packer } from "docx";
import type { TemplateId } from "@/lib/templates";
import { safeFileName, triggerDownload } from "../download-file";
import type { ResumePreview } from "../resume-preview";
import { buildResumeDocx } from "./resume-to-docx";

/**
 * Builds the .docx entirely in the browser and downloads it as `<fileName>.docx`.
 * No résumé content leaves the device. Loaded lazily by the download button so
 * the docx library stays out of the main bundle.
 */
export async function downloadResumeDocx(
  preview: ResumePreview,
  template: TemplateId,
  fileName: string,
): Promise<boolean> {
  const blob = await Packer.toBlob(buildResumeDocx(preview, template));
  return triggerDownload(blob, `${safeFileName(fileName)}.docx`);
}
