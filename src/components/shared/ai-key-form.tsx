import { R } from "@mobily/ts-belt";
import {
  CheckCircleIcon,
  KeyIcon,
  LockKeyIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { type FormEvent, useState } from "react";
import { useTranslations } from "use-intl";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useIsClient } from "@/hooks/use-is-client";
import { AI_PROVIDER_INFO } from "@/lib/ai/catalog";
import {
  decryptSecret,
  deleteVault,
  encryptSecret,
  readVault,
  writeVault,
} from "@/lib/ai/key-vault";
import type { AiError, AiProviderId } from "@/lib/ai/types";
import { useAiStore } from "@/lib/store/ai-store";
import { ExternalLink } from "./external-link";

interface AiKeyFormProps {
  provider: AiProviderId;
}

/**
 * Entering, checking, storing, unlocking, and deleting the key for one
 * provider. By default the key lives only in this tab's memory; storing it
 * encrypts it with a password the user picks.
 */
export function AiKeyForm(props: AiKeyFormProps) {
  const key = useAiStore((state) => state.keys[props.provider]);
  const isClient = useIsClient();
  // Bumped when the stored copy changes, so the vault is read again.
  const [vaultVersion, setVaultVersion] = useState(0);
  if (!isClient) return null;
  const vault = vaultVersion >= 0 ? readVault(props.provider) : null;

  if (key) {
    return (
      <AiKeyLoaded
        provider={props.provider}
        stored={vault !== null}
        onForget={() => setVaultVersion((v) => v + 1)}
      />
    );
  }
  if (vault) {
    return (
      <AiKeyUnlock
        provider={props.provider}
        onDeleted={() => setVaultVersion((v) => v + 1)}
      />
    );
  }
  return (
    <AiKeyEntry
      provider={props.provider}
      onStored={() => setVaultVersion((v) => v + 1)}
    />
  );
}

function AiKeyEntry(props: { provider: AiProviderId; onStored: () => void }) {
  const setKey = useAiStore((state) => state.setKey);
  const t = useTranslations("ai.key");
  const info = AI_PROVIDER_INFO[props.provider];
  const [value, setValue] = useState("");
  const [remember, setRemember] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      if (remember && password.length >= 8) {
        writeVault(props.provider, await encryptSecret(trimmed, password));
        props.onStored();
      }
      setKey(props.provider, trimmed);
      setValue("");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor={`ai-key-${props.provider}`}>
          {t("label", { provider: info.label })}
        </FieldLabel>
        <Input
          id={`ai-key-${props.provider}`}
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={info.keyHint}
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <FieldDescription>
          {t("where")}{" "}
          <ExternalLink href={info.consoleUrl} className="underline">
            {new URL(info.consoleUrl).host}
          </ExternalLink>
        </FieldDescription>
      </Field>
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={`ai-remember-${props.provider}`}
          className="text-sm text-muted-foreground"
        >
          {t("remember")}
        </label>
        <Switch
          id={`ai-remember-${props.provider}`}
          checked={remember}
          onCheckedChange={setRemember}
        />
      </div>
      {remember && (
        <Field>
          <FieldLabel htmlFor={`ai-password-${props.provider}`}>
            {t("password")}
          </FieldLabel>
          <Input
            id={`ai-password-${props.provider}`}
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldDescription>{t("passwordHint")}</FieldDescription>
        </Field>
      )}
      <Button
        type="submit"
        disabled={!value.trim() || busy || (remember && password.length < 8)}
      >
        {busy ? <Spinner /> : <KeyIcon />} {t("use")}
      </Button>
      <p className="text-xs text-muted-foreground text-pretty">
        {remember ? t("storedNote") : t("memoryNote")}
      </p>
    </form>
  );
}

function AiKeyUnlock(props: { provider: AiProviderId; onDeleted: () => void }) {
  const setKey = useAiStore((state) => state.setKey);
  const t = useTranslations("ai.key");
  const [password, setPassword] = useState("");
  const [wrong, setWrong] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const vault = readVault(props.provider);
    if (!vault) return;
    setBusy(true);
    const result = await decryptSecret(vault, password);
    setBusy(false);
    if (R.isError(result)) {
      setWrong(true);
      return;
    }
    setKey(props.provider, R.getExn(result));
    setPassword("");
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Field>
        <FieldLabel htmlFor={`ai-unlock-${props.provider}`}>
          {t("unlockLabel")}
        </FieldLabel>
        <Input
          id={`ai-unlock-${props.provider}`}
          type="password"
          autoComplete="current-password"
          aria-invalid={wrong}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setWrong(false);
          }}
        />
        {wrong && (
          <FieldDescription className="text-destructive">
            {t("wrongPassword")}
          </FieldDescription>
        )}
      </Field>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={busy || !password}>
          {busy ? <Spinner /> : <LockKeyIcon />} {t("unlock")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            deleteVault(props.provider);
            props.onDeleted();
          }}
        >
          <TrashIcon /> {t("delete")}
        </Button>
      </div>
    </form>
  );
}

function AiKeyLoaded(props: {
  provider: AiProviderId;
  stored: boolean;
  onForget: () => void;
}) {
  const key = useAiStore((state) => state.keys[props.provider] ?? "");
  const setKey = useAiStore((state) => state.setKey);
  const baseUrl = useAiStore((state) => state.baseUrls[props.provider]);
  const t = useTranslations("ai.key");
  const te = useTranslations("ai.errors");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<"ok" | AiError | null>(null);

  async function verify() {
    setChecking(true);
    setResult(null);
    const { verifyAiKey } = await import("@/lib/ai/run");
    const outcome = await verifyAiKey({
      provider: props.provider,
      apiKey: key,
      baseUrl,
      signal: AbortSignal.timeout(20_000),
    });
    setChecking(false);
    setResult(R.isOk(outcome) ? "ok" : R.getExn(R.flip(outcome)));
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-sm">
        <KeyIcon className="size-4" />
        <span className="font-mono">
          {key.slice(0, 7)}…{key.slice(-4)}
        </span>
        <span className="text-muted-foreground">
          {props.stored ? t("statusStored") : t("statusMemory")}
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => void verify()}>
          {checking ? <Spinner /> : <CheckCircleIcon />} {t("verify")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setKey(props.provider, null);
            deleteVault(props.provider);
            props.onForget();
          }}
        >
          <TrashIcon /> {t("delete")}
        </Button>
      </div>
      {result === "ok" && (
        <p className="flex items-center gap-2 text-sm text-success">
          <CheckCircleIcon weight="fill" /> {t("valid")}
        </p>
      )}
      {result !== null && result !== "ok" && (
        <p className="flex items-start gap-2 text-sm text-destructive">
          <WarningCircleIcon weight="fill" className="mt-0.5 shrink-0" />
          <span>
            {te(result.kind)}
            <span className="block text-xs text-muted-foreground">
              {result.detail}
            </span>
          </span>
        </p>
      )}
    </div>
  );
}
