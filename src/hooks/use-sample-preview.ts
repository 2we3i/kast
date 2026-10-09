import { useMemo } from "react";
import { useLocale } from "use-intl";
import { resumeToPreview } from "@/components/editor/resume-to-preview";
import { isLocale } from "@/i18n/routing";
import { sampleResume } from "@/lib/resume/seed-samples";

/** The sample résumé in the interface language, ready for a template tile. */
export function useSamplePreview() {
  const locale = useLocale();
  return useMemo(
    () => resumeToPreview(sampleResume(isLocale(locale) ? locale : "en")),
    [locale],
  );
}
