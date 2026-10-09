import { D, pipe } from "@mobily/ts-belt";
import { useTranslations } from "use-intl";
import { Progress } from "@/components/ui/progress";
import type { AtsCategory, CategoryScore } from "@/lib/ats/types";

interface AtsCategoriesProps {
  categories: Record<AtsCategory, CategoryScore>;
}

/** Per-category scores; a category that did not apply says why. */
export function AtsCategories(props: AtsCategoriesProps) {
  const t = useTranslations("ats");
  const rows = pipe(props.categories, D.toPairs);

  return (
    <ul className="flex flex-col gap-3">
      {rows.map(([category, value]) => (
        <li key={category} className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span>{t(`categories.${category}`)}</span>
            <span className="tabular-nums text-muted-foreground">
              {value.score === null ? t("notApplicable") : `${value.score}%`}
            </span>
          </div>
          <Progress
            value={value.score ?? 0}
            aria-label={t(`categories.${category}`)}
          />
        </li>
      ))}
    </ul>
  );
}
