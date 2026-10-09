import { DownloadSimpleIcon, SparkleIcon } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { PROSE_FEATURES } from "@/lib/resume/schema-fields";
import type { CoverLetter } from "@/lib/resume/types";
import { useEditorChromeStore, useResumeStore } from "@/lib/store";
import { useAiStore } from "@/lib/store/ai-store";
import type { LetterFormat } from "../letter/export-letter";
import { emptyCoverLetter, letterDate } from "../letter/letter-view";
import { RichTextEditor } from "../rich-text/rich-text-editor";

const FORMATS: ReadonlyArray<LetterFormat> = ["pdf", "docx", "txt"];

/**
 * The cover letter form. It writes into the open résumé, so the letter is
 * saved, versioned, and exported with it; the preview switches to the letter
 * while this tab is open.
 */
export function EditorLetterPanel() {
  const open = useResumeStore((state) => state.open);
  const undoEpoch = useResumeStore((state) => state.undoEpoch);
  if (!open) return null;
  return <EditorLetterForm key={`${open.id}:${undoEpoch}`} />;
}

function EditorLetterForm() {
  const open = useResumeStore((state) => state.open);
  const updateOpen = useResumeStore((state) => state.updateOpen);
  const setActiveTab = useEditorChromeStore((state) => state.setActiveTab);
  const setAiMode = useAiStore((state) => state.setMode);
  const t = useTranslations("editor.letter");
  const [exporting, setExporting] = useState<LetterFormat | null>(null);
  const form = useForm<CoverLetter>({
    defaultValues: open?.coverLetter ?? emptyCoverLetter(),
  });

  useEffect(() => {
    const subscription = form.watch(() => {
      updateOpen((resume) => ({ ...resume, coverLetter: form.getValues() }));
    });
    return () => subscription.unsubscribe();
  }, [form, updateOpen]);

  if (!open) return null;

  async function onExport(format: LetterFormat) {
    if (!open) return;
    setExporting(format);
    try {
      const { downloadLetter } = await import("../letter/export-letter");
      const saved = await downloadLetter(open, format);
      if (!saved) toast.error(t("exportFailed"));
    } finally {
      setExporting(null);
    }
  }

  function writeWithAi() {
    setAiMode("cover-letter");
    setActiveTab("ai");
  }

  return (
    <form className="flex flex-col gap-4 p-4">
      <p className="text-sm text-muted-foreground text-pretty">{t("intro")}</p>
      <Button type="button" variant="outline" onClick={writeWithAi}>
        <SparkleIcon /> {t("writeWithAi")}
      </Button>
      <FieldGroup className="gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput form={form} name="recipient" label={t("recipient")} />
          <TextInput form={form} name="company" label={t("company")} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput
            form={form}
            name="date"
            label={t("date")}
            placeholder={letterDate(open.language, new Date())}
          />
          <TextInput form={form} name="subject" label={t("subject")} />
        </div>
        <Controller
          control={form.control}
          name="body"
          render={(controller) => {
            const { field } = controller;
            return (
              <Field>
                <FieldLabel htmlFor="letter-body">{t("body")}</FieldLabel>
                <RichTextEditor
                  id="letter-body"
                  value={field.value}
                  features={PROSE_FEATURES}
                  placeholder={t("bodyPlaceholder")}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </Field>
            );
          }}
        />
        <TextInput
          form={form}
          name="closing"
          label={t("closing")}
          placeholder={t("closingPlaceholder")}
        />
      </FieldGroup>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">{t("export")}</span>
        <ButtonGroup className="w-full">
          {FORMATS.map((format) => (
            <Button
              key={format}
              type="button"
              variant="outline"
              className="flex-1"
              disabled={exporting !== null}
              onClick={() => void onExport(format)}
            >
              {exporting === format ? <Spinner /> : <DownloadSimpleIcon />}
              {format.toUpperCase()}
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </form>
  );
}

interface TextInputProps {
  form: ReturnType<typeof useForm<CoverLetter>>;
  name: "recipient" | "company" | "date" | "subject" | "closing";
  label: string;
  placeholder?: string;
}

function TextInput(props: TextInputProps) {
  return (
    <Controller
      control={props.form.control}
      name={props.name}
      render={(controller) => {
        const { field } = controller;
        const id = `letter-${props.name}`;
        return (
          <Field>
            <FieldLabel htmlFor={id}>{props.label}</FieldLabel>
            <Input id={id} placeholder={props.placeholder} {...field} />
          </Field>
        );
      }}
    />
  );
}
