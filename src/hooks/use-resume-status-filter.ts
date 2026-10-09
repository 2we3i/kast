import { parseAsStringLiteral, useQueryState } from "nuqs";
import { JOB_TARGET_STATUSES } from "@/lib/resume/job-target";

export const STATUS_FILTERS = ["all", ...JOB_TARGET_STATUSES] as const;

/**
 * The Library's application-status filter, in the `status` URL param beside
 * the search query. "all" shows every résumé and is dropped from the URL.
 */
export function useResumeStatusFilter() {
  return useQueryState(
    "status",
    parseAsStringLiteral(STATUS_FILTERS)
      .withDefault("all")
      .withOptions({ clearOnDefault: true }),
  );
}
