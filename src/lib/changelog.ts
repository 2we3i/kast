import { A, O, pipe } from "@mobily/ts-belt";

export interface ChangelogEntry {
  version: string;
  date: string;
}

/**
 * Release metadata for the "What's new" sheet, newest first. Each version's
 * highlights live in the `platform.changelog.entries` messages, keyed by version
 * with dots replaced by underscores, as a list of { title, description }.
 */
export const CHANGELOG: ChangelogEntry[] = [
  { version: "1.0.0", date: "2026-10-09" },
];

export const LATEST_CHANGELOG_VERSION = pipe(
  CHANGELOG,
  A.head,
  O.mapWithDefault("", (entry) => entry.version),
);
