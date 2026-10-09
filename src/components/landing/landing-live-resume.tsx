import { useMemo } from "react";
import type { ResumePreview } from "@/components/editor/resume-preview";
import { ResumeThumbnail } from "@/components/editor/resume-thumbnail";
import { resumeToPreview } from "@/components/editor/resume-to-preview";
import { sampleResume } from "@/lib/resume/seed-samples";
import type { ResumeLanguage } from "@/lib/resume/types";
import type { TemplateId } from "@/lib/templates";
import { cn } from "@/lib/utils";

/**
 * A live, framed render of a résumé through the real template engine, the same
 * components that draw the editor preview and feed the PDF. Nothing here is a
 * screenshot, so the landing page can never fall behind the product.
 */
export function LandingLiveResume(props: {
  template: TemplateId;
  /**
   * The sample's language. Passed in rather than read from context: some
   * of these islands render outside any translation provider.
   */
  language: ResumeLanguage;
  preview?: ResumePreview;
  cropHeight?: number;
  className?: string;
}) {
  const fallback = useMemo(
    () => resumeToPreview(sampleResume(props.language)),
    [props.language],
  );
  return (
    <div
      className={cn(
        "border border-foreground/15 bg-card p-1.5 shadow-sm",
        props.className,
      )}
    >
      <div
        className="overflow-hidden bg-white"
        style={{ maxHeight: props.cropHeight || undefined }}
      >
        <ResumeThumbnail
          resume={props.preview ?? fallback}
          template={props.template}
        />
      </div>
    </div>
  );
}
