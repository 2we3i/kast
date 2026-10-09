import { R } from "@mobily/ts-belt";
import {
  DownloadSimpleIcon,
  ShieldCheckIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useFormatter, useTranslations } from "use-intl";
import { triggerDownload } from "@/components/editor/download-file";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import {
  buildBackup,
  countStored,
  parseBackup,
  restoreBackup,
  type StoredCounts,
} from "@/lib/db/backup";
import { useResumeStore } from "@/lib/store";
import { SettingsClearDialog } from "./settings-clear-dialog";
import { SettingsSection } from "./settings-section";

/** Counts, storage use, backup and restore, and deleting everything. */
export function SettingsData() {
  const t = useTranslations("settings.data");
  const [version, setVersion] = useState(0);

  return (
    <SettingsSection
      id="data"
      title={t("heading")}
      description={t("description")}
    >
      <SettingsDataUsage version={version} />
      <SettingsDataBackup onRestored={() => setVersion((v) => v + 1)} />
      <SettingsDataPersist />
      <SettingsClearDialog />
    </SettingsSection>
  );
}

interface StorageUse {
  counts: StoredCounts;
  used: number | null;
  quota: number | null;
}

function estimateStorage(): Promise<StorageEstimate | null> {
  if (!navigator.storage?.estimate) return Promise.resolve(null);
  return navigator.storage.estimate().catch(() => null);
}

/** Reads the database counts and the browser's storage estimate. */
function useStorageUse(version: number): StorageUse | null {
  const [use, setUse] = useState<StorageUse | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new version re-reads the database after a restore
  useEffect(() => {
    let live = true;
    Promise.all([countStored(), estimateStorage()])
      .then(([counts, storage]) => {
        if (!live) return;
        setUse({
          counts,
          used: storage?.usage ?? null,
          quota: storage?.quota ?? null,
        });
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [version]);
  return use;
}

function SettingsDataUsage(props: { version: number }) {
  const t = useTranslations("settings.data");
  const format = useFormatter();
  const use = useStorageUse(props.version);
  if (!use) return null;
  const bytes = (value: number) =>
    `${format.number(value / 1024 / 1024, { maximumFractionDigits: 1 })} MB`;

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-muted/60 p-3 text-sm">
      <p className="font-medium">
        {t("stats", {
          resumes: use.counts.resumes,
          snapshots: use.counts.snapshots,
        })}
      </p>
      {use.used !== null && use.quota !== null && (
        <p className="text-muted-foreground">
          {t("storage", { used: bytes(use.used), quota: bytes(use.quota) })}
        </p>
      )}
    </div>
  );
}

function SettingsDataBackup(props: { onRestored: () => void }) {
  const t = useTranslations("settings.data");
  const hydrateIndex = useResumeStore((state) => state.hydrateIndex);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      const backup = await buildBackup();
      const day = new Date().toISOString().slice(0, 10);
      await triggerDownload(
        new Blob([JSON.stringify(backup, null, 2)], {
          type: "application/json",
        }),
        `kast-backup-${day}.json`,
      );
    } finally {
      setBusy(false);
    }
  }

  async function restore(file: File) {
    setBusy(true);
    try {
      const parsed = parseBackup(await file.text());
      if (R.isError(parsed)) {
        toast.error(t("invalid"));
        return;
      }
      const summary = await restoreBackup(R.getExn(parsed));
      await hydrateIndex();
      props.onRestored();
      toast.success(t("restored", { count: summary.added }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => void download()}
        >
          <DownloadSimpleIcon /> {t("export")}
        </Button>
        <FieldDescription>{t("exportHint")}</FieldDescription>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          <UploadSimpleIcon /> {t("import")}
        </Button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void restore(file);
          }}
        />
        <FieldDescription>{t("importHint")}</FieldDescription>
      </div>
    </div>
  );
}

type PersistState = "unknown" | "persisted" | "available" | "unsupported";

function SettingsDataPersist() {
  const t = useTranslations("settings.data");
  const [state, setState] = useState<PersistState>("unknown");

  useEffect(() => {
    if (!navigator.storage?.persisted) {
      setState("unsupported");
      return;
    }
    navigator.storage
      .persisted()
      .then((persisted) => setState(persisted ? "persisted" : "available"))
      .catch(() => setState("unsupported"));
  }, []);

  async function request() {
    const granted = await navigator.storage.persist().catch(() => false);
    setState(granted ? "persisted" : "available");
    if (granted) toast.success(t("persisted"));
    else toast(t("persistDenied"));
  }

  if (state === "unknown" || state === "unsupported") return null;
  if (state === "persisted") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheckIcon className="size-4 text-success" /> {t("persisted")}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="outline"
        className="w-fit"
        onClick={() => void request()}
      >
        <ShieldCheckIcon /> {t("persist")}
      </Button>
      <FieldDescription>{t("persistHint")}</FieldDescription>
    </div>
  );
}
