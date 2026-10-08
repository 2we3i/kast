import type { ResumeBlock } from "../../resume-blocks";
import { ResumeLanguagesList } from "../../resume-languages-list";
import { ResumeRichText } from "../../resume-rich-text";
import { ResumeSkillsList } from "../../resume-skills-list";
import { MonoCertificateItem } from "./mono-certificate-item";
import { MonoEducationItem } from "./mono-education-item";
import { MonoExperienceItem } from "./mono-experience-item";
import { MonoHeader } from "./mono-header";
import { MonoSectionHeading } from "./mono-section-heading";

interface MonoBlockViewProps {
  block: ResumeBlock;
}

/** "Mono": typewriter-flavored: monospace name/headings/dates over a sans body. */
export function MonoBlockView(props: MonoBlockViewProps) {
  const { block } = props;
  switch (block.kind) {
    case "header":
      return <MonoHeader {...block.header} />;
    case "heading":
      return <MonoSectionHeading title={block.title} />;
    case "summary":
      return <ResumeRichText blocks={block.body} />;
    case "experience":
      return <MonoExperienceItem {...block.item} />;
    case "education":
      return <MonoEducationItem {...block.item} />;
    case "certificate":
      return <MonoCertificateItem {...block.item} />;
    case "skills":
      return <ResumeSkillsList items={block.items} columns={block.columns} />;
    case "languages":
      return (
        <ResumeLanguagesList items={block.items} columns={block.columns} />
      );
  }
}
