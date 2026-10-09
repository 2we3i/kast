import { A } from "@mobily/ts-belt";
import { ResumeRichText } from "../resume-rich-text";
import type { LetterView } from "./letter-view";

interface LetterBodyProps {
  view: LetterView;
}

/**
 * Everything under the header: date, recipient, subject, the letter, and the
 * sign-off. Template-neutral on purpose; the header above it carries the
 * template's look, so résumé and letter read as a set.
 */
export function LetterBody(props: LetterBodyProps) {
  const { view } = props;
  return (
    <div className="mt-8 flex flex-col gap-5 resume-body-sm">
      <p className="text-muted-foreground">{view.date}</p>
      {A.isNotEmpty(view.recipient) && (
        <div>
          {view.recipient.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      )}
      {view.subject && (
        <p className="font-semibold text-(--resume-accent)">{view.subject}</p>
      )}
      <ResumeRichText
        blocks={view.body}
        className="space-y-3 resume-body-sm text-foreground"
      />
      <div>
        <p>{view.closing}</p>
        <p className="mt-6 font-semibold">{view.signature}</p>
      </div>
    </div>
  );
}
