import type { ResumeBlock } from "../../resume-blocks";
import { ResumeLanguagesList } from "../../resume-languages-list";
import { ResumeSkillsList } from "../../resume-skills-list";
import { AiryCertificateItem } from "./airy-certificate-item";
import { AiryEducationItem } from "./airy-education-item";
import { AiryExperienceItem } from "./airy-experience-item";
import { AiryHeader } from "./airy-header";
import { AirySectionHeading } from "./airy-section-heading";
import { AirySummaryBody } from "./airy-summary-body";

interface AiryBlockViewProps {
  block: ResumeBlock;
}

/** "Airy": an airy minimalist layout with slim accent bars and letterspaced headings. */
export function AiryBlockView(props: AiryBlockViewProps) {
  const { block } = props;
  switch (block.kind) {
    case "header":
      return <AiryHeader {...block.header} />;
    case "heading":
      return <AirySectionHeading title={block.title} />;
    case "summary":
      return <AirySummaryBody body={block.body} />;
    case "experience":
      return <AiryExperienceItem {...block.item} />;
    case "education":
      return <AiryEducationItem {...block.item} />;
    case "certificate":
      return <AiryCertificateItem {...block.item} />;
    case "skills":
      return <ResumeSkillsList items={block.items} columns={block.columns} />;
    case "languages":
      return (
        <ResumeLanguagesList items={block.items} columns={block.columns} />
      );
  }
}
