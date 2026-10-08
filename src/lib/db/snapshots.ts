import { A, O, pipe } from "@mobily/ts-belt";
import { nanoid } from "nanoid";
import type { Resume } from "@/lib/resume/types";
import { getDb, type ResumeSnapshot, type SnapshotReason } from "./schema";

/** How many history entries each résumé keeps; older ones are pruned. */
export const SNAPSHOT_LIMIT = 20;

/** A résumé's history, newest first. */
export async function listSnapshots(
  resumeId: string,
): Promise<ReadonlyArray<ResumeSnapshot>> {
  const db = await getDb();
  const all = await db.getAllFromIndex("snapshots", "by-resume", resumeId);
  return pipe(
    all,
    A.sortBy((snapshot) => snapshot.createdAt),
    A.reverse,
  );
}

interface AddSnapshotParams {
  resume: Resume;
  reason: SnapshotReason;
  label?: string;
}

/** Whether the newest stored entry already holds this exact document state. */
function isDuplicate(
  existing: ReadonlyArray<ResumeSnapshot>,
  resume: Resume,
): boolean {
  return O.mapWithDefault(
    A.head(existing),
    false,
    (newest) => newest.doc.updatedAt === resume.updatedAt,
  );
}

/**
 * Stores the document as a new history entry and prunes the oldest beyond the
 * limit. An automatic entry is skipped when the newest one already holds this
 * exact document state, so idle autosaves never fill the history with copies.
 */
export async function addSnapshot(
  params: AddSnapshotParams,
): Promise<ResumeSnapshot | undefined> {
  const { resume, reason, label } = params;
  const existing = await listSnapshots(resume.id);
  if (reason === "auto" && isDuplicate(existing, resume)) return undefined;
  const snapshot: ResumeSnapshot = {
    id: nanoid(),
    resumeId: resume.id,
    createdAt: new Date().toISOString(),
    reason,
    ...(label ? { label } : {}),
    doc: structuredClone(resume),
  };
  const db = await getDb();
  await db.put("snapshots", snapshot);
  const stale = A.drop(A.prepend(existing, snapshot), SNAPSHOT_LIMIT);
  for (const old of stale) await db.delete("snapshots", old.id);
  return snapshot;
}

export async function getSnapshot(
  id: string,
): Promise<ResumeSnapshot | undefined> {
  const db = await getDb();
  return db.get("snapshots", id);
}

export async function renameSnapshot(id: string, label: string): Promise<void> {
  const db = await getDb();
  const snapshot = await db.get("snapshots", id);
  if (!snapshot) return;
  await db.put("snapshots", { ...snapshot, label });
}

export async function deleteSnapshot(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("snapshots", id);
}
