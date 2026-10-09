import { CheckCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { LetterResult } from "@/lib/ai/schemas";
import { markdownToTiptap } from "@/lib/interchange/markdown";
import { useEditorChromeStore, useResumeStore } from "@/lib/store";
import { emptyCoverLetter } from "../letter/letter-view";

interface AiLetterResultProps {
  letter: LetterResult;
  snapshotLabel: string;
  onApplied: () => void;
}

/**
 * A drafted cover letter, editable before use. "Use this letter" fills the
 * Letter tab (the previous letter is kept in history).
 */
export function AiLetterResult(props: AiLetterResultProps) {
  const applyExternalEdit = useResumeStore((state) => state.applyExternalEdit);
  const takeSnapshot = useResumeStore((state) => state.takeSnapshot);
  const setActiveTab = useEditorChromeStore((state) => state.setActiveTab);
  const t = useTranslations("ai.review");
  const [subject, setSubject] = useState(props.letter.subject);
  const [body, setBody] = useState(props.letter.body);
  const [closing, setClosing] = useState(props.letter.closing);

  async function apply() {
    await takeSnapshot("before-ai", props.snapshotLabel);
    applyExternalEdit((resume) => ({
      ...resume,
      coverLetter: {
        ...emptyCoverLetter(),
        ...resume.coverLetter,
        subject,
        closing,
        body: markdownToTiptap(body),
      },
    }));
    props.onApplied();
    setActiveTab("letter");
  }

  return (
    <div className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor="ai-letter-subject">
          {t("letterSubject")}
        </FieldLabel>
        <Input
          id="ai-letter-subject"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="ai-letter-body">{t("letterBody")}</FieldLabel>
        <Textarea
          id="ai-letter-body"
          rows={12}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="ai-letter-closing">
          {t("letterClosing")}
        </FieldLabel>
        <Input
          id="ai-letter-closing"
          value={closing}
          onChange={(event) => setClosing(event.target.value)}
        />
      </Field>
      <Button onClick={() => void apply()}>
        <CheckCircleIcon /> {t("useLetter")}
      </Button>
    </div>
  );
}
