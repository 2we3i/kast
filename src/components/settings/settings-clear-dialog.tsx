import { S } from "@mobily/ts-belt";
import { TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslations } from "use-intl";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { clearAllData } from "@/lib/db/backup";

/**
 * Deletes everything after the user types a confirmation word, then reloads
 * so no in-memory copy of a deleted résumé lingers in any store.
 */
export function SettingsClearDialog() {
  const t = useTranslations("settings.data");
  const tCommon = useTranslations("forms.common");
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const word = t("clearWord");
  const confirmed = S.toUpperCase(S.trim(typed)) === S.toUpperCase(word);

  async function clear() {
    setBusy(true);
    await clearAllData();
    window.location.reload();
  }

  return (
    <AlertDialog onOpenChange={(open) => !open && setTyped("")}>
      <AlertDialogTrigger
        render={<Button variant="destructive" className="w-fit" />}
      >
        <TrashIcon /> {t("clear")}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("clearTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("clearDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="settings-clear-confirm">
            {t("clearConfirmLabel", { word })}
          </FieldLabel>
          <Input
            id="settings-clear-confirm"
            value={typed}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setTyped(event.target.value)}
          />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={!confirmed || busy}
            onClick={() => void clear()}
          >
            {busy ? <Spinner /> : <TrashIcon />} {t("clearConfirm")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
