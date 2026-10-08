import type { ResumeBlock } from "../../resume-blocks";
import { ResumeLanguagesList } from "../../resume-languages-list";
import { ResumeRichText } from "../../resume-rich-text";
import { ResumeSkillsList } from "../../resume-skills-list";
import { TimelineCertificateItem } from "./timeline-certificate-item";
import { TimelineEducationItem } from "./timeline-education-item";
import { TimelineExperienceItem } from "./timeline-experience-item";
import { TimelineHeader } from "./timeline-header";
import { TimelineSectionHeading } from "./timeline-section-heading";

interface TimelineBlockViewProps {
  block: ResumeBlock;
}

/** "Timeline": dates in a left column beside an accent rail (design mode). */
export function TimelineBlockView(props: TimelineBlockViewProps) {
  const { block } = props;
  switch (block.kind) {
    case "header":
      return <TimelineHeader {...block.header} />;
    case "heading":
      return <TimelineSectionHeading title={block.title} />;
    case "summary":
      return <ResumeRichText blocks={block.body} />;
    case "experience":
      return <TimelineExperienceItem {...block.item} />;
    case "education":
      return <TimelineEducationItem {...block.item} />;
    case "certificate":
      return <TimelineCertificateItem {...block.item} />;
    case "skills":
      return <ResumeSkillsList items={block.items} columns={block.columns} />;
    case "languages":
      return (
        <ResumeLanguagesList items={block.items} columns={block.columns} />
      );
  }
}
