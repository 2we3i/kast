import { useTranslations } from "use-intl";
import { cn } from "@/lib/utils";

interface AtsScoreProps {
  score: number;
}

/** The 0..100 score as a ring, colored by band. */
export function AtsScore(props: AtsScoreProps) {
  const t = useTranslations("ats");
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - props.score / 100);
  const band = scoreBand(props.score);

  return (
    <div className="flex items-center gap-4">
      <div className="relative size-24 shrink-0">
        <svg viewBox="0 0 80 80" className="size-24 -rotate-90" aria-hidden>
          <title>{props.score}</title>
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="fill-none stroke-muted"
            strokeWidth="8"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            className={cn("fill-none transition-[stroke-dashoffset]", {
              "stroke-success": band === "good",
              "stroke-warning": band === "fair",
              "stroke-destructive": band === "poor",
            })}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <p className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">
            {props.score}
          </span>
          <span className="text-[0.625rem] text-muted-foreground">/ 100</span>
        </p>
      </div>
      <div>
        <p className="font-medium">{t(`bands.${band}.title`)}</p>
        <p className="text-sm text-muted-foreground text-pretty">
          {t(`bands.${band}.description`)}
        </p>
      </div>
    </div>
  );
}

export type ScoreBand = "good" | "fair" | "poor";

export function scoreBand(score: number): ScoreBand {
  if (score >= 80) return "good";
  if (score >= 55) return "fair";
  return "poor";
}
