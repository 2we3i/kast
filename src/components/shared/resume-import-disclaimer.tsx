import { InfoIcon } from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ResumeImportDisclaimer() {
  const t = useTranslations("forms.import");
  return (
    <Alert>
      <InfoIcon className="size-4 mt-px" />
      <AlertDescription className="text-xs">{t("disclaimer")}</AlertDescription>
    </Alert>
  );
}
