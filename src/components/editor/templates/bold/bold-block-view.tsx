import type { ResumeBlock } from "../../resume-blocks";
import { ResumeLanguagesList } from "../../resume-languages-list";
import { ResumeRichText } from "../../resume-rich-text";
import { ResumeSkillsList } from "../../resume-skills-list";
import { BoldCertificateItem } from "./bold-certificate-item";
import { BoldEducationItem } from "./bold-education-item";
import { BoldExperienceItem } from "./bold-experience-item";
import { BoldHeader } from "./bold-header";
import { BoldSectionHeading } from "./bold-section-heading";

interface BoldBlockViewProps {
  block: ResumeBlock;
}

/** "Bold": a bold modern statement with heavy uppercase headings over thick rules. */
export function BoldBlockView(props: BoldBlockViewProps) {
  const { block } = props;
  switch (block.kind) {
    case "header":
      return <BoldHeader {...block.header} />;
    case "heading":
      return <BoldSectionHeading title={block.title} />;
    case "summary":
      return <ResumeRichText blocks={block.body} />;
    case "experience":
      return <BoldExperienceItem {...block.item} />;
    case "education":
      return <BoldEducationItem {...block.item} />;
    case "certificate":
      return <BoldCertificateItem {...block.item} />;
    case "skills":
      return <ResumeSkillsList items={block.items} columns={block.columns} />;
    case "languages":
      return (
        <ResumeLanguagesList items={block.items} columns={block.columns} />
      );
  }
}
