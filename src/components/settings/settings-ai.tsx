import { A, D, S } from "@mobily/ts-belt";
import { useState } from "react";
import { toast } from "sonner";
import { useFormatter, useTranslations } from "use-intl";
import { AiKeyForm } from "@/components/shared/ai-key-form";
import { SegmentedControl } from "@/components/shared/segmented-control";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { useIsClient } from "@/hooks/use-is-client";
import { AI_PROVIDER_IDS, AI_PROVIDER_INFO } from "@/lib/ai/catalog";
import type { MaskOptions } from "@/lib/ai/masking";
import type { AiProviderId } from "@/lib/ai/types";
import { useAiStore } from "@/lib/store/ai-store";
import { SettingsSection } from "./settings-section";

const MASK_KEYS: ReadonlyArray<keyof MaskOptions> = [
  "name",
  "email",
  "phone",
  "address",
  "links",
];

/** Provider, model, endpoint, key, consent, and masking for the AI assistant. */
export function SettingsAi() {
  const t = useTranslations("settings.ai");
  const provider = useAiStore((state) => state.provider);
  const setProvider = useAiStore((state) => state.setProvider);
  const isClient = useIsClient();
  const items = A.map(AI_PROVIDER_IDS, (id) => ({
    value: id,
    label: AI_PROVIDER_INFO[id].label,
  }));

  return (
    <SettingsSection
      id="ai"
      title={t("heading")}
      description={t("description")}
    >
      <Field>
        <FieldLabel>{t("provider")}</FieldLabel>
        <div>
          <SegmentedControl
            aria-label={t("provider")}
            value={isClient ? provider : "anthropic"}
            onValueChange={(value) => setProvider(value as AiProviderId)}
            items={items}
          />
        </div>
      </Field>
      {isClient && <SettingsAiModel key={provider} provider={provider} />}
      {isClient && (
        <SettingsAiEndpoint key={`url-${provider}`} provider={provider} />
      )}
      <section className="flex flex-col gap-3 rounded-lg border p-4">
        <h3 className="text-sm font-medium">{t("keyHeading")}</h3>
        {isClient && <AiKeyForm provider={provider} />}
      </section>
      {isClient && <SettingsAiConsent provider={provider} />}
      <SettingsAiMasking />
    </SettingsSection>
  );
}

function SettingsAiModel(props: { provider: AiProviderId }) {
  const t = useTranslations("settings.ai");
  const model = useAiStore((state) => state.models[props.provider]);
  const setModel = useAiStore((state) => state.setModel);
  const info = AI_PROVIDER_INFO[props.provider];
  const known = A.some(info.models, (item) => item.id === model);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field>
        <FieldLabel htmlFor="settings-ai-model">{t("model")}</FieldLabel>
        <NativeSelect
          id="settings-ai-model"
          value={known ? model : ""}
          onChange={(event) => {
            if (event.target.value)
              setModel(props.provider, event.target.value);
          }}
        >
          {!known && <NativeSelectOption value="">{model}</NativeSelectOption>}
          {info.models.map((item) => (
            <NativeSelectOption key={item.id} value={item.id}>
              {item.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </Field>
      <Field>
        <FieldLabel htmlFor="settings-ai-custom-model">
          {t("customModel")}
        </FieldLabel>
        <Input
          id="settings-ai-custom-model"
          defaultValue={known ? "" : model}
          placeholder={info.defaultModel}
          spellCheck={false}
          autoComplete="off"
          onBlur={(event) => {
            const value = S.trim(event.target.value);
            setModel(props.provider, value || info.defaultModel);
          }}
        />
        <FieldDescription>{t("customModelHint")}</FieldDescription>
      </Field>
    </div>
  );
}

/** An https URL, or null. */
function parseEndpoint(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return S.replaceByRe(url.href, /\/+$/, "");
  } catch {
    return null;
  }
}

function SettingsAiEndpoint(props: { provider: AiProviderId }) {
  const t = useTranslations("settings.ai");
  const baseUrl = useAiStore((state) => state.baseUrls[props.provider]);
  const setBaseUrl = useAiStore((state) => state.setBaseUrl);
  const [invalid, setInvalid] = useState(false);

  function commit(value: string) {
    const trimmed = S.trim(value);
    if (!trimmed) {
      setInvalid(false);
      setBaseUrl(props.provider, "");
      return;
    }
    const parsed = parseEndpoint(trimmed);
    setInvalid(parsed === null);
    if (parsed) setBaseUrl(props.provider, parsed);
  }

  return (
    <Field data-invalid={invalid || undefined}>
      <FieldLabel htmlFor="settings-ai-endpoint">{t("baseUrl")}</FieldLabel>
      <Input
        id="settings-ai-endpoint"
        type="url"
        inputMode="url"
        defaultValue={baseUrl}
        placeholder={AI_PROVIDER_INFO[props.provider].defaultBaseUrl}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={invalid || undefined}
        onBlur={(event) => commit(event.target.value)}
      />
      {invalid && <FieldError>{t("baseUrlInvalid")}</FieldError>}
      <FieldDescription>{t("baseUrlHint")}</FieldDescription>
    </Field>
  );
}

function SettingsAiConsent(props: { provider: AiProviderId }) {
  const t = useTranslations("settings.ai");
  const format = useFormatter();
  const consentedAt = useAiStore((state) => state.consent[props.provider]);
  const revokeConsent = useAiStore((state) => state.revokeConsent);
  const label = AI_PROVIDER_INFO[props.provider].label;

  function status(): string {
    if (!consentedAt) return t("consentNone", { provider: label });
    const date = format.dateTime(new Date(consentedAt), {
      dateStyle: "medium",
    });
    return t("consentGiven", { provider: label, date });
  }

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{t("consentHeading")}</h3>
      <p className="text-sm text-muted-foreground">{status()}</p>
      {consentedAt && (
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => {
            revokeConsent(props.provider);
            toast.success(t("revoked"));
          }}
        >
          {t("revoke")}
        </Button>
      )}
    </section>
  );
}

function SettingsAiMasking() {
  const t = useTranslations("settings.ai");
  const tMask = useTranslations("ai.preview.mask");
  const masking = useAiStore((state) => state.masking);
  const setMasking = useAiStore((state) => state.setMasking);
  const isClient = useIsClient();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{t("maskHeading")}</legend>
      <p className="text-sm text-muted-foreground">{t("maskDescription")}</p>
      <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MASK_KEYS.map((key) => (
          <label
            key={key}
            htmlFor={`settings-mask-${key}`}
            className="flex items-center gap-2 text-sm"
          >
            <Checkbox
              id={`settings-mask-${key}`}
              checked={isClient && masking[key]}
              onCheckedChange={(checked) =>
                setMasking(D.set(masking, key, checked === true))
              }
            />
            {tMask(key)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
