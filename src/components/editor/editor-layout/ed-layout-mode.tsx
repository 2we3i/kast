import { CheckIcon, PaletteIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useTranslations } from "use-intl";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import type { Field } from "@/lib/resume/types";
import { useResumeStore } from "@/lib/store";
import {
  ACCENT_SWATCHES,
  resolveTemplateId,
  TEMPLATE_ACCENT,
} from "@/lib/templates";
import { cn } from "@/lib/utils";

function plainText(field: Field | undefined): string {
  return field?.kind === "plain" ? field.value.trim() : "";
}

/**
 * The ATS-safe / design mode switch, with the design-only controls under it:
 * the accent color and the portfolio QR code. The text and its order are the
 * same in both modes; only presentation changes.
 */
export function EditorLayoutMode() {
  const open = useResumeStore((state) => state.open);
  const updateOpen = useResumeStore((state) => state.updateOpen);
  const t = useTranslations("editor.mode");

  if (!open) return null;
  const atsMode = open.atsMode ?? true;

  function setMode(value: string) {
    updateOpen((resume) => ({ ...resume, atsMode: value === "ats" }));
  }

  return (
    <section className="flex flex-col gap-3 px-4 pb-4" id="tour-editor-mode">
      <SegmentedControl
        aria-label={t("label")}
        value={atsMode ? "ats" : "design"}
        onValueChange={setMode}
        className="w-full"
        items={[
          { value: "ats", label: t("ats"), ariaLabel: t("atsAria") },
          { value: "design", label: t("design"), ariaLabel: t("designAria") },
        ]}
      />
      <Alert>
        {atsMode ? (
          <ShieldCheckIcon className="size-4" />
        ) : (
          <PaletteIcon className="size-4" />
        )}
        <AlertDescription className="text-xs">
          {atsMode ? t("atsHint") : t("designHint")}
        </AlertDescription>
      </Alert>
      {!atsMode && <EditorLayoutDesignControls />}
    </section>
  );
}

function EditorLayoutDesignControls() {
  const open = useResumeStore((state) => state.open);
  const updateOpen = useResumeStore((state) => state.updateOpen);
  const t = useTranslations("editor.mode");
  if (!open) return null;

  const templateAccent = TEMPLATE_ACCENT[resolveTemplateId(open.templateId)];
  const current = open.accentColor ?? templateAccent;
  const swatches = [templateAccent, ...ACCENT_SWATCHES].filter(
    (color, index, all) => all.indexOf(color) === index,
  );
  const link =
    plainText(open.header.fields.website) || plainText(open.header.fields.link);

  function setAccent(color: string | undefined) {
    updateOpen((resume) => ({ ...resume, accentColor: color }));
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-muted-foreground">
          {t("accent")}
        </legend>
        <div className="flex flex-wrap items-center gap-2">
          {swatches.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={t("accentSwatch", { color })}
              aria-pressed={current === color}
              onClick={() =>
                setAccent(color === templateAccent ? undefined : color)
              }
              className={cn(
                "flex size-7 items-center justify-center rounded-full ring-offset-2 ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring",
                current === color && "ring-2 ring-foreground",
              )}
              style={{ backgroundColor: color }}
            >
              {current === color && (
                <CheckIcon className="size-3.5 text-white" />
              )}
            </button>
          ))}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="color"
              value={current}
              onChange={(event) => setAccent(event.target.value)}
              className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
            />
            {t("accentCustom")}
          </label>
        </div>
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span id="design-qr-label" className="text-sm text-muted-foreground">
            {t("qr")}
          </span>
          <span className="text-xs text-muted-foreground/80">
            {link ? t("qrHint", { link }) : t("qrNeedsLink")}
          </span>
        </div>
        <Switch
          aria-labelledby="design-qr-label"
          checked={Boolean(open.showQr) && Boolean(link)}
          disabled={!link}
          onCheckedChange={(next) =>
            updateOpen((resume) => ({ ...resume, showQr: next }))
          }
        />
      </div>
    </div>
  );
}
