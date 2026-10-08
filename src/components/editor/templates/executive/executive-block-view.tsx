import type { ResumeBlock } from "../../resume-blocks";
import { ResumeLanguagesList } from "../../resume-languages-list";
import { ResumeRichText } from "../../resume-rich-text";
import { ResumeSkillsList } from "../../resume-skills-list";
import { ExecutiveCertificateItem } from "./executive-certificate-item";
import { ExecutiveEducationItem } from "./executive-education-item";
import { ExecutiveExperienceItem } from "./executive-experience-item";
import { ExecutiveHeader } from "./executive-header";
import { ExecutiveSectionHeading } from "./executive-section-heading";

interface ExecutiveBlockViewProps {
  block: ResumeBlock;
}

/** "Executive": a heavy uppercase name over a thick rule, headings as chips. */
export function ExecutiveBlockView(props: ExecutiveBlockViewProps) {
  const { block } = props;
  switch (block.kind) {
    case "header":
      return <ExecutiveHeader {...block.header} />;
    case "heading":
      return <ExecutiveSectionHeading title={block.title} />;
    case "summary":
      return <ResumeRichText blocks={block.body} />;
    case "experience":
      return <ExecutiveExperienceItem {...block.item} />;
    case "education":
      return <ExecutiveEducationItem {...block.item} />;
    case "certificate":
      return <ExecutiveCertificateItem {...block.item} />;
    case "skills":
      return <ResumeSkillsList items={block.items} columns={block.columns} />;
    case "languages":
      return (
        <ResumeLanguagesList items={block.items} columns={block.columns} />
      );
  }
}
