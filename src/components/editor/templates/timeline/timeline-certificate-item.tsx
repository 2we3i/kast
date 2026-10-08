import { dateRangeText } from "../../resume-date-range";
import { ResumeOptionalLink } from "../../resume-optional-link";
import type { CertificateItemView } from "../../resume-preview";
import { TimelineRail } from "./timeline-rail";

export function TimelineCertificateItem(props: CertificateItemView) {
  return (
    <TimelineRail
      dates={dateRangeText(props.startDate, props.endDate)}
      title={
        <h3 className="resume-body-xs font-semibold">
          <ResumeOptionalLink href={props.href} className="underline">
            {props.title}
          </ResumeOptionalLink>
        </h3>
      }
    >
      <p className="resume-body-xs text-muted-foreground">{props.issuer}</p>
    </TimelineRail>
  );
}
