import { resumeToEuropass } from "@/lib/export/europass";
import { europassToXml } from "@/lib/export/europass-xml";
import type { Resume } from "@/lib/resume/types";
import { safeFileName, triggerDownload } from "./download-file";

/** Downloads the résumé as a Europass CV, XML or JSON. */
export async function downloadResumeEuropass(
  resume: Resume,
  fileName: string,
  variant: "xml" | "json",
): Promise<boolean> {
  const europass = resumeToEuropass(resume);
  const name = safeFileName(fileName);
  if (variant === "xml") {
    const blob = new Blob([europassToXml(europass)], {
      type: "application/xml;charset=utf-8",
    });
    return triggerDownload(blob, `${name}.europass.xml`);
  }
  const blob = new Blob([`${JSON.stringify(europass, null, 2)}\n`], {
    type: "application/json;charset=utf-8",
  });
  return triggerDownload(blob, `${name}.europass.json`);
}
