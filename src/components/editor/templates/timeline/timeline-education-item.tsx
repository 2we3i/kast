import { dateRangeText } from "../../resume-date-range";
import { withLocation } from "../../resume-entry-location";
import type { EducationItemView } from "../../resume-preview";
import { ResumeRichText } from "../../resume-rich-text";
import { TimelineRail } from "./timeline-rail";

export function TimelineEducationItem(props: EducationItemView) {
  return (
    <TimelineRail
      dates={dateRangeText(props.startDate, props.endDate)}
      title={<h3 className="resume-body-sm font-semibold">{props.degree}</h3>}
    >
      <p className="resume-body-xs font-medium text-(--resume-accent)">
        {withLocation(props.institution, props.location)}
      </p>
      <ResumeRichText blocks={props.details} className="mt-1" />
    </TimelineRail>
  );
}
