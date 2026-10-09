import { useEffect, useState } from "react";
import { listSnapshots, type ResumeSnapshot } from "@/lib/db";
import { useResumeStore } from "@/lib/store";

/**
 * The open résumé's version history, newest first, re-read from IndexedDB
 * whenever the store reports a change to it.
 */
export function useSnapshots(): ReadonlyArray<ResumeSnapshot> | null {
  const resumeId = useResumeStore((state) => state.open?.id);
  const version = useResumeStore((state) => state.snapshotsVersion);
  const [snapshots, setSnapshots] =
    useState<ReadonlyArray<ResumeSnapshot> | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `version` is the re-read trigger for a history change made elsewhere.
  useEffect(() => {
    if (!resumeId) return;
    let cancelled = false;
    void listSnapshots(resumeId).then((list) => {
      if (!cancelled) setSnapshots(list);
    });
    return () => {
      cancelled = true;
    };
  }, [resumeId, version]);

  return snapshots;
}

/** How often an edited résumé is saved to its history on its own. */
const AUTO_SNAPSHOT_MS = 3 * 60 * 1000;

/**
 * Saves the open résumé to its history every few minutes while it changes, and
 * once more when the page is hidden. An unchanged document is never saved
 * twice (addSnapshot compares against the newest entry).
 */
export function useAutoSnapshots(): void {
  const takeSnapshot = useResumeStore((state) => state.takeSnapshot);

  useEffect(() => {
    const save = () => void takeSnapshot("auto");
    const timer = window.setInterval(save, AUTO_SNAPSHOT_MS);
    const onHide = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [takeSnapshot]);
}
