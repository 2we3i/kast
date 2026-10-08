import type { RichBlock } from "@/lib/resume/rich-content";
import { ResumeRichText } from "../../resume-rich-text";

interface AirySummaryBodyProps {
  body: ReadonlyArray<RichBlock>;
}

export function AirySummaryBody(props: AirySummaryBodyProps) {
  return (
    <div className="border-l-2 border-foreground/30 pl-4">
      <ResumeRichText blocks={props.body} />
    </div>
  );
}
