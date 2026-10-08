import type { ResumeBlock } from "../../resume-blocks";
import { ResumeLanguagesList } from "../../resume-languages-list";
import { ResumeRichText } from "../../resume-rich-text";
import { ResumeSkillsList } from "../../resume-skills-list";
import { ElegantCertificateItem } from "./elegant-certificate-item";
import { ElegantEducationItem } from "./elegant-education-item";
import { ElegantExperienceItem } from "./elegant-experience-item";
import { ElegantHeader } from "./elegant-header";
import { ElegantSectionHeading } from "./elegant-section-heading";

interface ElegantBlockViewProps {
  block: ResumeBlock;
}

/** "Elegant": a centered serif page with fine double-ruled headings. */
export function ElegantBlockView(props: ElegantBlockViewProps) {
  const { block } = props;
  switch (block.kind) {
    case "header":
      return <ElegantHeader {...block.header} />;
    case "heading":
      return <ElegantSectionHeading title={block.title} />;
    case "summary":
      return <ResumeRichText blocks={block.body} className="font-serif" />;
    case "experience":
      return <ElegantExperienceItem {...block.item} />;
    case "education":
      return <ElegantEducationItem {...block.item} />;
    case "certificate":
      return <ElegantCertificateItem {...block.item} />;
    case "skills":
      return (
        <div className="font-serif">
          <ResumeSkillsList items={block.items} columns={block.columns} />
        </div>
      );
    case "languages":
      return (
        <div className="font-serif">
          <ResumeLanguagesList items={block.items} columns={block.columns} />
        </div>
      );
  }
}
