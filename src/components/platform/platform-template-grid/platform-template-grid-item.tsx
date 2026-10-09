import { useState } from "react";
import { useTranslations } from "use-intl";
import { ResumeThumbnail } from "@/components/editor/resume-thumbnail";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSamplePreview } from "@/hooks/use-sample-preview";
import type { TemplateSummary } from "@/lib/templates";
import { PlatformPaperFrame } from "../platform-paper-frame";
import { PlatformResumeCreateDialog } from "../platform-resume-create-dialog";

interface PlatformTemplateGridItemProps {
  template: TemplateSummary;
}

export function PlatformTemplateGridItem(props: PlatformTemplateGridItemProps) {
  const { template } = props;
  const [open, setOpen] = useState(false);
  const t = useTranslations("platform.templates");
  const sample = useSamplePreview();

  return (
    <Card size="sm" className="pt-0">
      <div className="relative">
        <PlatformPaperFrame>
          <ResumeThumbnail resume={sample} template={template.id} />
        </PlatformPaperFrame>
        <button
          type="button"
          aria-label={t("use", { name: template.name })}
          onClick={() => setOpen(true)}
          className="absolute inset-0 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        />
      </div>

      <CardHeader>
        <CardTitle className="truncate">{template.name}</CardTitle>
        <CardDescription className="line-clamp-3 text-xs">
          {template.description}
        </CardDescription>
      </CardHeader>

      <CardFooter className="mt-auto">
        <Button size="lg" className="w-full" onClick={() => setOpen(true)}>
          {t("use", { name: template.name })}
        </Button>
      </CardFooter>

      <PlatformResumeCreateDialog
        open={open}
        onOpenChange={setOpen}
        templateId={template.id}
      />
    </Card>
  );
}
