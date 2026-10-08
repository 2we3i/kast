import { dateRangeText } from "../../resume-date-range";
import { ResumeOptionalLink } from "../../resume-optional-link";
import type { CertificateItemView } from "../../resume-preview";

export function ExecutiveCertificateItem(props: CertificateItemView) {
  return (
    <article>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="resume-body-xs font-bold">
          <ResumeOptionalLink href={props.href} className="underline">
            {props.title}
          </ResumeOptionalLink>
        </h3>
        <span className="shrink-0 resume-body-xs font-semibold text-muted-foreground">
          {dateRangeText(props.startDate, props.endDate)}
        </span>
      </div>
      <p className="resume-body-xs text-muted-foreground">{props.issuer}</p>
    </article>
  );
}
