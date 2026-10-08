import type { IDBPDatabase } from "idb";
import { openDB } from "idb";
import type { KastDB } from "./schema";

/** The database name the product used before it became Kast. */
const LEGACY_DB_NAME = "lanjut";

/**
 * Marks the one-time copy as done. Kept in localStorage rather than the Kast
 * database so that "delete all data" (which drops the database and then sets
 * this flag again) never pulls the old documents back in.
 */
export const LEGACY_IMPORTED_KEY = "kast:legacy-db-imported";

function readFlag(): boolean {
  try {
    return localStorage.getItem(LEGACY_IMPORTED_KEY) !== null;
  } catch {
    return true;
  }
}

function writeFlag(): void {
  try {
    localStorage.setItem(LEGACY_IMPORTED_KEY, new Date().toISOString());
  } catch {
    // Storage blocked: the copy is idempotent, so trying again is harmless.
  }
}

async function legacyDatabaseExists(): Promise<boolean> {
  if (typeof indexedDB.databases !== "function") return false;
  const list = await indexedDB.databases();
  return list.some((info) => info.name === LEGACY_DB_NAME);
}

type LegacyStore = "resumes" | "backups" | "leftovers";

async function readLegacyStore(
  legacy: IDBPDatabase,
  name: LegacyStore,
): Promise<{ keys: IDBValidKey[]; values: unknown[] }> {
  if (!legacy.objectStoreNames.contains(name)) return { keys: [], values: [] };
  const tx = legacy.transaction(name, "readonly");
  const [keys, values] = await Promise.all([
    tx.store.getAllKeys(),
    tx.store.getAll(),
  ]);
  await tx.done;
  return { keys, values };
}

/**
 * Copies every document of the previous product's database into Kast's, once.
 * The old database is never deleted or written to, so nothing can be lost if
 * the copy is interrupted; the next visit simply tries again. A résumé whose id
 * already exists in Kast is kept as it is.
 */
export async function importLegacyDatabase(
  db: IDBPDatabase<KastDB>,
): Promise<void> {
  if (readFlag()) return;
  if (!(await legacyDatabaseExists())) {
    writeFlag();
    return;
  }

  // Opened without a version: reads whatever layout the old app left behind.
  const legacy = await openDB(LEGACY_DB_NAME);
  try {
    const resumes = await readLegacyStore(legacy, "resumes");
    for (const value of resumes.values) {
      const id = (value as { id?: unknown }).id;
      if (typeof id !== "string" || (await db.get("resumes", id))) continue;
      await db.put("resumes", value as KastDB["resumes"]["value"]);
    }
    const backups = await readLegacyStore(legacy, "backups");
    for (const [index, value] of backups.values.entries()) {
      await db.put(
        "backups",
        value as KastDB["backups"]["value"],
        String(backups.keys[index]),
      );
    }
    const leftovers = await readLegacyStore(legacy, "leftovers");
    for (const value of leftovers.values) {
      await db.put("leftovers", value as KastDB["leftovers"]["value"]);
    }
    writeFlag();
  } finally {
    legacy.close();
  }
}
