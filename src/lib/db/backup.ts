import { A, G, R } from "@mobily/ts-belt";
import type { Resume } from "@/lib/resume/types";
import { LEGACY_IMPORTED_KEY } from "./legacy";
import { closeDb, DB_NAME, getDb, type ResumeSnapshot } from "./schema";

export const BACKUP_FORMAT = "kast-backup";
export const BACKUP_VERSION = 1;

/**
 * Everything Kast keeps for this browser, in one file: every résumé (raw, as
 * stored) and every version-history entry. Settings and the AI key are not
 * part of it: the key never leaves the browser unencrypted, and settings are
 * cheap to set again.
 */
export interface KastBackup {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  /** ISO 8601. */
  exportedAt: string;
  resumes: ReadonlyArray<unknown>;
  snapshots: ReadonlyArray<ResumeSnapshot>;
}

export async function buildBackup(): Promise<KastBackup> {
  const db = await getDb();
  const [resumes, snapshots] = await Promise.all([
    db.getAll("resumes"),
    db.getAll("snapshots"),
  ]);
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    resumes,
    snapshots,
  };
}

export type BackupReadError = "not-json" | "not-backup";

function parseJson(text: string): R.Result<unknown, BackupReadError> {
  try {
    return R.makeOk(JSON.parse(text) as unknown);
  } catch {
    return R.makeError("not-json");
  }
}

/** Reads a backup file's text, checking its envelope only. */
export function parseBackup(
  text: string,
): R.Result<KastBackup, BackupReadError> {
  return R.flatMap(parseJson(text), (raw) => {
    const value = raw as Partial<KastBackup> | null;
    if (
      !G.isObject(value) ||
      value.format !== BACKUP_FORMAT ||
      !G.isArray(value.resumes)
    ) {
      return R.makeError<KastBackup, BackupReadError>("not-backup");
    }
    return R.makeOk<KastBackup, BackupReadError>({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: G.isString(value.exportedAt) ? value.exportedAt : "",
      resumes: value.resumes,
      snapshots: G.isArray(value.snapshots) ? value.snapshots : [],
    });
  });
}

export interface RestoreSummary {
  added: number;
  skipped: number;
}

/**
 * Adds the backup's résumés next to the ones already here. A résumé whose id
 * already exists is skipped rather than overwritten, so restoring an old backup
 * can never destroy newer work. Documents keep their stored shape and step up
 * the migration ladder on first read, like any other.
 */
export async function restoreBackup(
  backup: KastBackup,
): Promise<RestoreSummary> {
  const db = await getDb();
  const existing = new Set(await db.getAllKeys("resumes"));
  const fresh = A.filter(backup.resumes, (raw) => {
    const id = (raw as { id?: unknown } | null)?.id;
    return G.isString(id) && !existing.has(id);
  });
  for (const raw of fresh) await db.put("resumes", raw as Resume);

  const knownSnapshots = new Set(await db.getAllKeys("snapshots"));
  const freshSnapshots = A.reject(backup.snapshots, (snapshot) =>
    knownSnapshots.has(snapshot.id),
  );
  for (const snapshot of freshSnapshots) await db.put("snapshots", snapshot);

  return {
    added: A.length(fresh),
    skipped: A.length(backup.resumes) - A.length(fresh),
  };
}

/** Every localStorage key, read defensively (storage can be blocked). */
function storageKeys(): ReadonlyArray<string> {
  try {
    return A.filterMap(
      A.makeWithIndex(localStorage.length, (index) => index),
      (index) => localStorage.key(index) ?? undefined,
    );
  } catch {
    return [];
  }
}

/**
 * Deletes everything Kast stores in this browser: the database and every
 * `kast:` setting, the encrypted AI key included. Irreversible by design; the
 * settings page asks first.
 */
export async function clearAllData(): Promise<void> {
  await closeDb();
  await new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
  try {
    for (const key of A.filter(storageKeys(), (key) =>
      key.startsWith("kast:"),
    )) {
      localStorage.removeItem(key);
    }
    // Kept so the previous product's settings and documents are not copied
    // back in on the next visit.
    localStorage.setItem("kast:storage-migrated", "1");
    localStorage.setItem(LEGACY_IMPORTED_KEY, new Date().toISOString());
    sessionStorage.clear();
  } catch {
    // Storage blocked: nothing was stored there.
  }
}
