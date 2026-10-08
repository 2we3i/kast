import { dateRangeText } from "../../resume-date-range";
import { locationSuffix } from "../../resume-entry-location";
import { ResumeOptionalLink } from "../../resume-optional-link";
import type { ExperienceItemView } from "../../resume-preview";
import { ResumeRichText } from "../../resume-rich-text";
import { TimelineRail } from "./timeline-rail";

export function TimelineExperienceItem(props: ExperienceItemView) {
  return (
    <TimelineRail
      dates={dateRangeText(props.startDate, props.endDate)}
      title={
        <h3 className="resume-body-sm font-semibold">
          <ResumeOptionalLink href={props.roleHref} className="underline">
            {props.role}
          </ResumeOptionalLink>
        </h3>
      }
    >
      <p className="resume-body-xs font-medium text-(--resume-accent)">
        <ResumeOptionalLink href={props.companyHref} className="underline">
          {props.company}
        </ResumeOptionalLink>
        {locationSuffix(props.company, props.location)}
      </p>
      {Boolean(props.companyContext) && (
        <p className="resume-body-xs text-muted-foreground">
          {props.companyContext}
        </p>
      )}
      <ResumeRichText blocks={props.description} className="mt-1" />
    </TimelineRail>
  );
}
