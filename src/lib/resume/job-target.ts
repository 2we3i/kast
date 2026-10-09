import type { JobTargetStatus } from "./types";

/** Every application status, in the order an application moves through. */
export const JOB_TARGET_STATUSES: ReadonlyArray<JobTargetStatus> = [
  "draft",
  "applied",
  "interview",
  "offer",
  "rejected",
];
