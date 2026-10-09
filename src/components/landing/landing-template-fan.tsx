import type { ResumeLanguage } from "@/lib/resume/types";
import { LandingLiveResume } from "./landing-live-resume";

/**
 * Three templates rendering the same document live, fanned like prints on a
 * desk. Replaces the old templates screenshot.
 */
export function LandingTemplateFan(props: { language: ResumeLanguage }) {
  return (
    <div className="grid grid-cols-3 items-start gap-3 sm:gap-4">
      <LandingLiveResume
        template="modern"
        language={props.language}
        cropHeight={300}
        className="translate-y-4 -rotate-2"
      />
      <LandingLiveResume
        template="executive"
        language={props.language}
        cropHeight={300}
      />
      <LandingLiveResume
        template="elegant"
        language={props.language}
        cropHeight={300}
        className="translate-y-4 rotate-2"
      />
    </div>
  );
}
