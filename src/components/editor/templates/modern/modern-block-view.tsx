import type { ResumeBlock } from "../../resume-blocks";
import { ResumeLanguagesList } from "../../resume-languages-list";
import { ResumeRichText } from "../../resume-rich-text";
import { ResumeSkillsList } from "../../resume-skills-list";
import { ModernCertificateItem } from "./modern-certificate-item";
import { ModernEducationItem } from "./modern-education-item";
import { ModernExperienceItem } from "./modern-experience-item";
import { ModernHeader } from "./modern-header";
import { ModernSectionHeading } from "./modern-section-heading";

interface ModernBlockViewProps {
  block: ResumeBlock;
}

/** "Modern": a color-banded header and accent-led headings, in a clean sans. */
export function ModernBlockView(props: ModernBlockViewProps) {
  const { block } = props;
  switch (block.kind) {
    case "header":
      return <ModernHeader {...block.header} />;
    case "heading":
      return <ModernSectionHeading title={block.title} />;
    case "summary":
      return <ResumeRichText blocks={block.body} />;
    case "experience":
      return <ModernExperienceItem {...block.item} />;
    case "education":
      return <ModernEducationItem {...block.item} />;
    case "certificate":
      return <ModernCertificateItem {...block.item} />;
    case "skills":
      return <ResumeSkillsList items={block.items} columns={block.columns} />;
    case "languages":
      return (
        <ResumeLanguagesList items={block.items} columns={block.columns} />
      );
  }
}
