import { CrosshairIcon, FloppyDiskIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslations } from "use-intl";
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/shared/responsive-dialog";
import { UrlInput } from "@/components/shared/url-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { JOB_TARGET_STATUSES } from "@/lib/resume/job-target";
import type { JobTarget, JobTargetStatus } from "@/lib/resume/types";
import { useResumeStore } from "@/lib/store";

export const EMPTY_TARGET: JobTarget = {
  company: "",
  position: "",
  url: "",
  appliedAt: "",
  status: "draft",
  notes: "",
  description: "",
};

/** The toolbar button showing the tailored-for vacancy, opening its form. */
export function EditorTargetButton() {
  const target = useResumeStore((state) => state.open?.target);
  const t = useTranslations("editor.target");
  const [open, setOpen] = useState(false);
  const label = [target?.position, target?.company].filter(Boolean).join(" · ");

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="max-w-72"
        id="tour-target"
        onClick={() => setOpen(true)}
      >
        <CrosshairIcon />
        <span className="truncate">{label || t("empty")}</span>
        {target && target.status !== "draft" && (
          <Badge variant="secondary">{t(`statuses.${target.status}`)}</Badge>
        )}
      </Button>
      {open && <EditorTargetDialog open={open} onOpenChange={setOpen} />}
    </>
  );
}

interface EditorTargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditorTargetDialog(props: EditorTargetDialogProps) {
  const target = useResumeStore((state) => state.open?.target);
  const updateOpen = useResumeStore((state) => state.updateOpen);
  const t = useTranslations("editor.target");
  const tc = useTranslations("forms.common");
  const form = useForm<JobTarget>({
    defaultValues: { ...EMPTY_TARGET, ...target },
  });

  const onSubmit = form.handleSubmit((values) => {
    updateOpen((resume) => ({ ...resume, target: values }));
    props.onOpenChange(false);
  });

  return (
    <ResponsiveDialog open={props.open} onOpenChange={props.onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-xl">
        <form onSubmit={onSubmit}>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t("title")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t("description")}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <FieldGroup className="my-4 gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField form={form} name="position" label={t("position")} />
              <TextField form={form} name="company" label={t("company")} />
            </div>
            <Controller
              control={form.control}
              name="url"
              render={(controller) => {
                const { field } = controller;
                return (
                  <Field>
                    <FieldLabel htmlFor="target-url">{t("url")}</FieldLabel>
                    <UrlInput
                      id="target-url"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  </Field>
                );
              }}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="appliedAt"
                render={(controller) => {
                  const { field } = controller;
                  return (
                    <Field>
                      <FieldLabel htmlFor="target-applied">
                        {t("appliedAt")}
                      </FieldLabel>
                      <Input id="target-applied" type="date" {...field} />
                    </Field>
                  );
                }}
              />
              <Controller
                control={form.control}
                name="status"
                render={(controller) => {
                  const { field } = controller;
                  return (
                    <Field>
                      <FieldLabel htmlFor="target-status">
                        {t("status")}
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          field.onChange(value ?? "draft")
                        }
                      >
                        <SelectTrigger id="target-status" className="w-full">
                          <SelectValue>
                            {(value: JobTargetStatus) => t(`statuses.${value}`)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {JOB_TARGET_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {t(`statuses.${status}`)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                  );
                }}
              />
            </div>
            <Controller
              control={form.control}
              name="notes"
              render={(controller) => {
                const { field } = controller;
                return (
                  <Field>
                    <FieldLabel htmlFor="target-notes">{t("notes")}</FieldLabel>
                    <Textarea id="target-notes" rows={2} {...field} />
                  </Field>
                );
              }}
            />
            <Controller
              control={form.control}
              name="description"
              render={(controller) => {
                const { field } = controller;
                return (
                  <Field>
                    <FieldLabel htmlFor="target-description">
                      {t("vacancy")}
                    </FieldLabel>
                    <Textarea
                      id="target-description"
                      rows={6}
                      placeholder={t("vacancyPlaceholder")}
                      {...field}
                    />
                    <FieldDescription>{t("vacancyHint")}</FieldDescription>
                  </Field>
                );
              }}
            />
          </FieldGroup>
          <ResponsiveDialogFooter>
            <ResponsiveDialogClose variant="outline" type="button">
              {tc("cancel")}
            </ResponsiveDialogClose>
            <Button type="submit">
              <FloppyDiskIcon /> {tc("save")}
            </Button>
          </ResponsiveDialogFooter>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

interface TextFieldProps {
  form: ReturnType<typeof useForm<JobTarget>>;
  name: "company" | "position";
  label: string;
}

function TextField(props: TextFieldProps) {
  return (
    <Controller
      control={props.form.control}
      name={props.name}
      render={(controller) => {
        const { field } = controller;
        return (
          <Field>
            <FieldLabel htmlFor={`target-${props.name}`}>
              {props.label}
            </FieldLabel>
            <Input id={`target-${props.name}`} {...field} />
          </Field>
        );
      }}
    />
  );
}
