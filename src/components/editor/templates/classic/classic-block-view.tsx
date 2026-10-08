import type { ResumeBlock } from "../../resume-blocks";
import { ResumeLanguagesList } from "../../resume-languages-list";
import { ResumeRichText } from "../../resume-rich-text";
import { ResumeSkillsList } from "../../resume-skills-list";
import { ClassicCertificateItem } from "./classic-certificate-item";
import { ClassicEducationItem } from "./classic-education-item";
import { ClassicExperienceItem } from "./classic-experience-item";
import { ClassicHeader } from "./classic-header";
import { ClassicSectionHeading } from "./classic-section-heading";

interface ClassicBlockViewProps {
  block: ResumeBlock;
}

/** "Classic": a traditional all-serif CV with a centered header and quiet headings. */
export function ClassicBlockView(props: ClassicBlockViewProps) {
  const { block } = props;
  switch (block.kind) {
    case "header":
      return <ClassicHeader {...block.header} />;
    case "heading":
      return <ClassicSectionHeading title={block.title} />;
    case "summary":
      return <ResumeRichText blocks={block.body} className="font-serif" />;
    case "experience":
      return <ClassicExperienceItem {...block.item} />;
    case "education":
      return <ClassicEducationItem {...block.item} />;
    case "certificate":
      return <ClassicCertificateItem {...block.item} />;
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
