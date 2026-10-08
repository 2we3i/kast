import type { ResumeBlock } from "../../resume-blocks";
import { ResumeLanguagesList } from "../../resume-languages-list";
import { ResumeRichText } from "../../resume-rich-text";
import { ResumeSkillsList } from "../../resume-skills-list";
import { CompactCertificateItem } from "./compact-certificate-item";
import { CompactEducationItem } from "./compact-education-item";
import { CompactExperienceItem } from "./compact-experience-item";
import { CompactHeader } from "./compact-header";
import { CompactSectionHeading } from "./compact-section-heading";

interface CompactBlockViewProps {
  block: ResumeBlock;
}

/** "Compact": a compact serif classic with centered, ruled section headings. */
export function CompactBlockView(props: CompactBlockViewProps) {
  const { block } = props;
  switch (block.kind) {
    case "header":
      return <CompactHeader {...block.header} />;
    case "heading":
      return <CompactSectionHeading title={block.title} />;
    case "summary":
      return <ResumeRichText blocks={block.body} />;
    case "experience":
      return <CompactExperienceItem {...block.item} />;
    case "education":
      return <CompactEducationItem {...block.item} />;
    case "certificate":
      return <CompactCertificateItem {...block.item} />;
    case "skills":
      return <ResumeSkillsList items={block.items} columns={block.columns} />;
    case "languages":
      return (
        <ResumeLanguagesList items={block.items} columns={block.columns} />
      );
  }
}
