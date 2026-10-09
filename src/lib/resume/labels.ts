import type { ResumeLanguage } from "./types";

export const RESUME_LANGUAGES: ResumeLanguage[] = ["en", "lt", "ru"];

/** Section headings, keyed by section type (certificates keeps its old key). */
interface HeadingLabels {
  summary: string;
  experience: string;
  internship: string;
  projects: string;
  organizations: string;
  volunteering: string;
  education: string;
  courses: string;
  certificates: string;
  publications: string;
  skills: string;
  languages: string;
  interests: string;
  references: string;
  driving: string;
  salary: string;
  availability: string;
  coverLetter: string;
}

/** Words used when a singleton section is composed into a sentence. */
interface PhraseLabels {
  speaking: string;
  understanding: string;
  writing: string;
  native: string;
  drivingCategory: string;
  salaryFrom: string;
  per: Record<string, string>;
  tax: Record<string, string>;
  availabilityStatus: Record<string, string>;
  availableFrom: string;
  notice: string;
  relocationYes: string;
  relocationNo: string;
  age: string;
  page: string;
  /**
   * Proficiency words the editor offers, stored in English, rendered in the
   * document's language. Anything else (an imported "Įgudęs") shows as typed.
   */
  levels: Record<string, string>;
}

interface DocumentLabels extends HeadingLabels, PhraseLabels {
  /** End-date label for an ongoing role or study. */
  present: string;
  /** Twelve month abbreviations, indexed 0 (January) to 11 (December). */
  months: string[];
}

/**
 * Fixed labels rendered into the résumé document, per language. Kept separate
 * from the UI messages: the document's language is its own field, not the
 * app's UI locale.
 */
export const RESUME_LABELS: Record<ResumeLanguage, DocumentLabels> = {
  en: {
    summary: "Summary",
    experience: "Experience",
    internship: "Internship",
    projects: "Projects",
    organizations: "Organizations",
    volunteering: "Volunteering",
    education: "Education",
    courses: "Courses",
    certificates: "Certificates",
    publications: "Publications",
    skills: "Skills",
    languages: "Languages",
    interests: "Interests",
    references: "References",
    driving: "Driving licence",
    salary: "Expected salary",
    availability: "Availability",
    coverLetter: "Cover letter",
    present: "Present",
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    speaking: "Speaking",
    understanding: "Understanding",
    writing: "Writing",
    native: "Native",
    drivingCategory: "Category",
    salaryFrom: "From",
    per: { month: "per month", year: "per year", hour: "per hour" },
    tax: { gross: "before tax", net: "after tax" },
    availabilityStatus: {
      immediately: "Available immediately",
      notice: "Available after notice period",
      "from-date": "Available from a set date",
      open: "Open to offers",
      "not-looking": "Not actively looking",
    },
    availableFrom: "Available from",
    notice: "Notice period",
    relocationYes: "Open to relocation",
    relocationNo: "Not open to relocation",
    age: "Age",
    page: "Page",
    levels: {
      Beginner: "Beginner",
      Intermediate: "Intermediate",
      Advanced: "Advanced",
      Expert: "Expert",
      Native: "Native",
      Fluent: "Fluent",
      Professional: "Professional",
      Conversational: "Conversational",
      Basic: "Basic",
    },
  },
  lt: {
    summary: "Apie mane",
    experience: "Darbo patirtis",
    internship: "Praktika",
    projects: "Projektai",
    organizations: "Organizacijos",
    volunteering: "Savanorystė",
    education: "Išsilavinimas",
    courses: "Kursai",
    certificates: "Sertifikatai",
    publications: "Publikacijos",
    skills: "Įgūdžiai",
    languages: "Kalbos",
    interests: "Pomėgiai",
    references: "Rekomendacijos",
    driving: "Vairuotojo pažymėjimas",
    salary: "Pageidaujamas atlyginimas",
    availability: "Darbo statusas",
    coverLetter: "Motyvacinis laiškas",
    present: "Dabar",
    months: [
      "Sau",
      "Vas",
      "Kov",
      "Bal",
      "Geg",
      "Bir",
      "Lie",
      "Rgp",
      "Rgs",
      "Spa",
      "Lap",
      "Gru",
    ],
    speaking: "Kalbėjimas",
    understanding: "Supratimas",
    writing: "Rašymas",
    native: "Gimtoji",
    drivingCategory: "Kategorija",
    salaryFrom: "Nuo",
    per: { month: "per mėnesį", year: "per metus", hour: "per valandą" },
    tax: { gross: "neatskaičius mokesčių", net: "atskaičius mokesčius" },
    availabilityStatus: {
      immediately: "Galiu pradėti nedelsiant",
      notice: "Galiu pradėti po įspėjimo termino",
      "from-date": "Galiu pradėti nuo nurodytos datos",
      open: "Atviras pasiūlymams",
      "not-looking": "Aktyviai darbo neieškau",
    },
    availableFrom: "Galiu pradėti nuo",
    notice: "Įspėjimo terminas",
    relocationYes: "Galiu persikelti",
    relocationNo: "Persikelti negaliu",
    age: "Amžius",
    page: "Puslapis",
    levels: {
      Beginner: "Pradedantysis",
      Intermediate: "Vidutinis",
      Advanced: "Pažengęs",
      Expert: "Ekspertas",
      Native: "Gimtoji",
      Fluent: "Laisvai",
      Professional: "Profesionaliai",
      Conversational: "Pokalbio lygiu",
      Basic: "Pagrindai",
    },
  },
  ru: {
    summary: "О себе",
    experience: "Опыт работы",
    internship: "Стажировки",
    projects: "Проекты",
    organizations: "Организации",
    volunteering: "Волонтёрство",
    education: "Образование",
    courses: "Курсы",
    certificates: "Сертификаты",
    publications: "Публикации",
    skills: "Навыки",
    languages: "Языки",
    interests: "Хобби и интересы",
    references: "Рекомендации",
    driving: "Водительские права",
    salary: "Ожидаемая зарплата",
    availability: "Готовность к работе",
    coverLetter: "Сопроводительное письмо",
    present: "н.в.",
    months: [
      "янв",
      "фев",
      "мар",
      "апр",
      "май",
      "июн",
      "июл",
      "авг",
      "сен",
      "окт",
      "ноя",
      "дек",
    ],
    speaking: "Говорение",
    understanding: "Понимание",
    writing: "Письмо",
    native: "Родной",
    drivingCategory: "Категория",
    salaryFrom: "От",
    per: { month: "в месяц", year: "в год", hour: "в час" },
    tax: { gross: "до вычета налогов", net: "после вычета налогов" },
    availabilityStatus: {
      immediately: "Готов приступить сразу",
      notice: "Готов приступить после срока уведомления",
      "from-date": "Готов приступить с указанной даты",
      open: "Открыт к предложениям",
      "not-looking": "Не ищу работу активно",
    },
    availableFrom: "Могу приступить с",
    notice: "Срок уведомления",
    relocationYes: "Готов к переезду",
    relocationNo: "Не готов к переезду",
    age: "Возраст",
    page: "Страница",
    levels: {
      Beginner: "Начальный",
      Intermediate: "Средний",
      Advanced: "Продвинутый",
      Expert: "Эксперт",
      Native: "Родной",
      Fluent: "Свободно",
      Professional: "Профессиональный",
      Conversational: "Разговорный",
      Basic: "Базовый",
    },
  },
};
