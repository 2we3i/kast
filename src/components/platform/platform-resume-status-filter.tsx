import { A } from "@mobily/ts-belt";
import { useTranslations } from "use-intl";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  STATUS_FILTERS,
  useResumeStatusFilter,
} from "@/hooks/use-resume-status-filter";
import { useResumeStore } from "@/lib/store";

/** Filters the Library by application status, once any résumé has one. */
export function PlatformResumeStatusFilter() {
  const hasTargets = useResumeStore((state) =>
    A.some(state.index, (entry) => entry.target !== undefined),
  );
  const [status, setStatus] = useResumeStatusFilter();
  const t = useTranslations("platform.grid");
  const tStatus = useTranslations("editor.target.statuses");

  if (!hasTargets && status === "all") return null;

  return (
    <NativeSelect
      aria-label={t("filterLabel")}
      value={status}
      onChange={(event) =>
        void setStatus(event.target.value as (typeof STATUS_FILTERS)[number])
      }
      className="w-auto shrink-0"
    >
      {STATUS_FILTERS.map((value) => (
        <NativeSelectOption key={value} value={value}>
          {value === "all" ? t("filterAll") : tStatus(value)}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
