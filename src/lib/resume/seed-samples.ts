import { SEED_RESUME } from "./seed";
import { SEED_RESUME_LT } from "./seed-lt";
import { SEED_RESUME_RU } from "./seed-ru";
import type { Resume, ResumeLanguage } from "./types";

const SAMPLES: Record<ResumeLanguage, Resume> = {
  en: SEED_RESUME,
  lt: SEED_RESUME_LT,
  ru: SEED_RESUME_RU,
};

/**
 * The sample résumé written in `language`, so an example started from the
 * Lithuanian or Russian interface reads naturally in that language.
 */
export function sampleResume(language: ResumeLanguage): Resume {
  return SAMPLES[language];
}
