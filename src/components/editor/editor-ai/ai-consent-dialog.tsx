import { ShieldWarningIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslations } from "use-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AI_PROVIDER_INFO } from "@/lib/ai/catalog";
import type { AiProviderId } from "@/lib/ai/types";
import { useAiStore } from "@/lib/store/ai-store";

interface AiConsentDialogProps {
  open: boolean;
  provider: AiProviderId;
  onOpenChange: (open: boolean) => void;
  /** Called once consent is granted, to send the request. */
  onConsent: () => void;
}

/**
 * The one-time warning before the first request to a provider: the résumé
 * text leaves the browser for that provider. Consent is stored locally and
 * can be withdrawn in Settings.
 */
export function AiConsentDialog(props: AiConsentDialogProps) {
  const grantConsent = useAiStore((state) => state.grantConsent);
  const t = useTranslations("ai.consent");
  const [checked, setChecked] = useState(false);
  const provider = AI_PROVIDER_INFO[props.provider].label;

  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldWarningIcon className="size-5 text-warning" />
            {t("title", { provider })}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-pretty">
            {t("body", { provider })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{t("pointDirect", { provider })}</li>
          <li>{t("pointMasked")}</li>
          <li>{t("pointPhoto")}</li>
          <li>{t("pointBilling", { provider })}</li>
          <li>{t("pointRevoke")}</li>
        </ul>
        <label htmlFor="ai-consent" className="flex items-start gap-2 text-sm">
          <Checkbox
            id="ai-consent"
            checked={checked}
            onCheckedChange={(value) => setChecked(value === true)}
            className="mt-0.5"
          />
          {t("agree", { provider })}
        </label>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={!checked}
            onClick={() => {
              grantConsent(props.provider);
              props.onOpenChange(false);
              props.onConsent();
            }}
          >
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
