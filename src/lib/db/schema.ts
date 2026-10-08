import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { Resume } from "@/lib/resume/types";
import { importLegacyDatabase } from "./legacy";

export const DB_NAME = "kast";

/**
 * IndexedDB structural version. Governs object stores and indexes ONLY; document
 * field-shape changes are versioned separately by the in-document schemaVersion
 * and its migration ladder (see docs/schema-migrations.md). Bump this only when
 * adding/changing a store or index, never for a field-shape change.
 *
 * v1-v3: resumes, app, backups, leftovers (inherited layout).
 * v4: adds the `snapshots` store for per-résumé version history.
 */
const DB_VERSION = 4;

/** Keys used in the single-value `app` meta store. */
export const META_KEYS = {
  lastOpenedResumeId: "lastOpenedResumeId",
} as const;

/**
 * A raw pre-migration snapshot of a résumé document, written before the first
 * read that steps it up the ladder, so a buggy or lossy migration is always
 * recoverable. Keyed by `${resumeId}@v${schemaVersion}`: one snapshot per
 * document per ladder crossing.
 */
export interface ResumeBackup {
  resumeId: string;
  schemaVersion: number;
  /** ISO 8601. */
  backedUpAt: string;
  /** The document exactly as it was persisted, before any migration ran. */
  doc: unknown;
}

/**
 * Text chunks a PDF import could not confidently place into the structured
 * document. Kept beside the document, not inside it, so the clean structural
 * shape is never polluted; surfaced in the editor for the user to copy in or
 * dismiss. Keyed by resumeId.
 */
export interface ImportLeftovers {
  resumeId: string;
  items: string[];
}

/** Why a version-history snapshot was taken. */
export type SnapshotReason =
  | "auto"
  | "manual"
  | "before-restore"
  | "before-import"
  | "before-ai";

/**
 * One entry of a résumé's version history: the whole document as it was at
 * `createdAt`. History keeps the newest SNAPSHOT_LIMIT per résumé.
 */
export interface ResumeSnapshot {
  id: string;
  resumeId: string;
  /** ISO 8601. */
  createdAt: string;
  reason: SnapshotReason;
  /** Optional user label, e.g. "Sent to Acme". */
  label?: string;
  doc: Resume;
}

export interface KastDB extends DBSchema {
  resumes: {
    key: string;
    value: Resume;
    indexes: { "by-updatedAt": string };
  };
  /** Small key/value store for app pointers such as lastOpenedResumeId. */
  app: {
    key: string;
    value: string;
  };
  backups: {
    key: string;
    value: ResumeBackup;
  };
  leftovers: {
    key: string;
    value: ImportLeftovers;
  };
  snapshots: {
    key: string;
    value: ResumeSnapshot;
    indexes: { "by-resume": string };
  };
}

let dbPromise: Promise<IDBPDatabase<KastDB>> | null = null;

/**
 * Lazily open the singleton database. Guarded against server rendering; this is
 * the only persistence tier and it never leaves the browser. The one throw in
 * frontend code: every IndexedDB call already fails by rejecting.
 */
export function getDb(): Promise<IDBPDatabase<KastDB>> {
  if (typeof indexedDB === "undefined") {
    throw new Error(
      "IndexedDB is unavailable (server or unsupported environment).",
    );
  }
  if (!dbPromise) {
    dbPromise = openDB<KastDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("resumes")) {
          const store = db.createObjectStore("resumes", { keyPath: "id" });
          store.createIndex("by-updatedAt", "updatedAt");
        }
        if (!db.objectStoreNames.contains("app")) {
          db.createObjectStore("app");
        }
        if (!db.objectStoreNames.contains("backups")) {
          db.createObjectStore("backups");
        }
        if (!db.objectStoreNames.contains("leftovers")) {
          db.createObjectStore("leftovers", { keyPath: "resumeId" });
        }
        if (!db.objectStoreNames.contains("snapshots")) {
          const store = db.createObjectStore("snapshots", { keyPath: "id" });
          store.createIndex("by-resume", "resumeId");
        }
      },
    }).then(async (db) => {
      await importLegacyDatabase(db).catch(() => undefined);
      return db;
    });
  }
  return dbPromise;
}

/** Forgets the open connection, so the next getDb() reopens from scratch. */
export async function closeDb(): Promise<void> {
  if (!dbPromise) return;
  const db = await dbPromise.catch(() => null);
  db?.close();
  dbPromise = null;
}
