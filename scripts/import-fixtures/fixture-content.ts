/**
 * Fictional résumés for the PDF import test set. Every person, company,
 * phone number, and e-mail here is invented (example.com / example.lt); the
 * spec forbids real people's data in the repository.
 */

export type Lang = "en" | "lt" | "ru";

export interface FixtureJob {
  title: string;
  company: string;
  site?: string;
  /** As written on the page. */
  dates: string;
  /** What the importer should store. */
  start: string;
  end: string;
  duration?: string;
  bullets: string[];
}

export interface FixtureSchool {
  degree: string;
  school: string;
  dates: string;
  start: string;
  end: string;
}

export interface FixtureResume {
  lang: Lang;
  name: string;
  headline: string;
  city: string;
  email: string;
  phone: string;
  summary: string;
  jobs: FixtureJob[];
  schools: FixtureSchool[];
  skills: { name: string; level: string; description?: string }[];
  languages: {
    name: string;
    level: string;
    skills?: [string, string, string];
  }[];
  references?: {
    company: string;
    position: string;
    name: string;
    phone: string;
    email: string;
  }[];
  salary?: string;
  availability?: string;
  driving?: string;
  interests?: string;
}

export const HEADINGS: Record<Lang, Record<string, string>> = {
  en: {
    summary: "Summary",
    experience: "Work experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    references: "References",
    salary: "Expected salary",
    availability: "Availability",
    driving: "Driving licence",
    interests: "Interests",
    level: "Level",
    speaking: "Speaking",
    understanding: "Understanding",
    writing: "Writing",
  },
  lt: {
    summary: "Trumpai apie mane",
    experience: "Darbo patirtis",
    education: "Išsilavinimas",
    skills: "Kompiuterinės žinios",
    languages: "Kalbos",
    references: "Rekomendacijos",
    salary: "Pageidaujamas atlyginimas",
    availability: "Darbo statusas",
    driving: "Vairuotojo pažymėjimas",
    interests: "Laisvalaikio pomėgiai",
    level: "Lygis",
    speaking: "Kalbėjimas",
    understanding: "Supratimas",
    writing: "Rašymas",
  },
  ru: {
    summary: "О себе",
    experience: "Опыт работы",
    education: "Образование",
    skills: "Навыки",
    languages: "Языки",
    references: "Рекомендации",
    salary: "Ожидаемая зарплата",
    availability: "Готовность к работе",
    driving: "Водительские права",
    interests: "Хобби и интересы",
    level: "Уровень",
    speaking: "Говорение",
    understanding: "Понимание",
    writing: "Письмо",
  },
};

export const PEOPLE: Record<Lang, FixtureResume> = {
  lt: {
    lang: "lt",
    name: "Ona Pavyzdytė",
    headline: "Logistikos koordinatorė",
    city: "Kaunas",
    email: "ona.pavyzdyte@example.lt",
    phone: "+370 600 00011",
    summary:
      "Turiu penkerių metų patirtį organizuojant sandėlio ir pristatymo procesus. Gerai išmanau atsargų apskaitą, dirbu su ERP sistemomis ir koordinuoju nedideles komandas.",
    jobs: [
      {
        title: "Logistikos koordinatorė",
        company: "UAB Pavyzdys",
        site: "pavyzdys.example.lt",
        dates: "2022.03 - 2026.05",
        start: "Mar 2022",
        end: "May 2026",
        duration: "4 metai 2 mėnesiai",
        bullets: [
          "Koordinavau kasdienius pristatymus 40 klientų.",
          "Sumažinau sandėlio likučių neatitikimus perpus.",
        ],
      },
      {
        title: "Sandėlininkė",
        company: "Testinė logistika",
        site: "testine.example.lt",
        dates: "2019.09 - 2022.02",
        start: "Sep 2019",
        end: "Feb 2022",
        duration: "2 metai 5 mėnesiai",
        bullets: [
          "Priėmiau ir išdaviau prekes.",
          "Tvarkiau lydimuosius dokumentus.",
        ],
      },
    ],
    schools: [
      {
        degree: "Logistikos bakalauras",
        school: "Kauno technologijos universitetas",
        dates: "2015.09 - 2019.06",
        start: "Sep 2015",
        end: "Jun 2019",
      },
    ],
    skills: [
      {
        name: "Excel",
        level: "Įgudęs",
        description: "Suvestinės ir formulės atsargų apskaitai.",
      },
      {
        name: "SAP | Navision",
        level: "Pažengęs",
        description: "Užsakymų ir likučių valdymas.",
      },
    ],
    languages: [
      {
        name: "Lietuvių",
        level: "Gimtoji",
        skills: ["Puikiai", "Puikiai", "Puikiai"],
      },
      { name: "Anglų", level: "", skills: ["Gerai", "Labai gerai", "Gerai"] },
    ],
    references: [
      {
        company: "UAB Pavyzdys",
        position: "Direktorius",
        name: "Jonas Testas",
        phone: "+370 600 00022",
        email: "jonas.testas@example.lt",
      },
    ],
    salary: "1800 Eur (neatskaičius mokesčių)",
    availability: "Galima darbo pradžia: Nedelsiant",
    driving: "B",
    interests: "Žygiai, fotografija ir stalo žaidimai.",
  },
  ru: {
    lang: "ru",
    name: "Анна Примерова",
    headline: "Менеджер проектов",
    city: "Вильнюс",
    email: "anna.primerova@example.com",
    phone: "+370 600 00033",
    summary:
      "Руковожу проектами внедрения ПО шесть лет. Отвечаю за сроки, бюджет и коммуникацию с заказчиками, выстраиваю процессы в командах до пятнадцати человек.",
    jobs: [
      {
        title: "Менеджер проектов",
        company: "ООО Пример",
        site: "primer.example.com",
        dates: "03.2021 – по настоящее время",
        start: "Mar 2021",
        end: "Present",
        duration: "5 лет 7 месяцев",
        bullets: [
          "Запустила 12 проектов внедрения CRM в срок.",
          "Сократила срок онбординга клиентов на 30%.",
        ],
      },
      {
        title: "Аналитик",
        company: "Тест Софт",
        dates: "сентябрь 2017 – февраль 2021",
        start: "Sep 2017",
        end: "Feb 2021",
        duration: "3 года 6 месяцев",
        bullets: ["Собирала требования.", "Готовила отчёты для руководства."],
      },
    ],
    schools: [
      {
        degree: "Магистр экономики",
        school: "Вильнюсский университет",
        dates: "2015 – 2017",
        start: "2015",
        end: "2017",
      },
    ],
    skills: [
      {
        name: "Jira",
        level: "Продвинутый",
        description: "Настройка процессов и отчётов.",
      },
      { name: "SQL", level: "Средний", description: "Выборки для аналитики." },
    ],
    languages: [
      {
        name: "Русский",
        level: "Родной",
        skills: ["Отлично", "Отлично", "Отлично"],
      },
      {
        name: "Английский",
        level: "",
        skills: ["Хорошо", "Свободно", "Хорошо"],
      },
    ],
    references: [
      {
        company: "ООО Пример",
        position: "Технический директор",
        name: "Иван Тестов",
        phone: "+370 600 00044",
        email: "ivan.testov@example.com",
      },
    ],
    salary: "2500 EUR на руки",
    availability: "Готов приступить сразу",
    driving: "B, C",
    interests: "Бег, шахматы и путешествия.",
  },
  en: {
    lang: "en",
    name: "Alex Sample",
    headline: "Frontend Engineer",
    city: "Vilnius",
    email: "alex.sample@example.com",
    phone: "+370 600 00055",
    summary:
      "Frontend engineer with seven years of experience building accessible web applications in React and TypeScript, from design systems to performance work.",
    jobs: [
      {
        title: "Senior Frontend Engineer",
        company: "Example Corp",
        site: "example.com",
        dates: "Jan 2021 – Present",
        start: "Jan 2021",
        end: "Present",
        duration: "5 yrs 9 mos",
        bullets: [
          "Led the migration of 40 screens to a shared design system.",
          "Cut the main bundle by 35% with route-level code splitting.",
        ],
      },
      {
        title: "Frontend Developer",
        company: "Sample Labs",
        dates: "05/2017 – 12/2020",
        start: "May 2017",
        end: "Dec 2020",
        duration: "3 yrs 8 mos",
        bullets: [
          "Built the customer dashboard in React.",
          "Added end-to-end tests.",
        ],
      },
    ],
    schools: [
      {
        degree: "BSc Computer Science",
        school: "Vilnius University",
        dates: "2013 – 2017",
        start: "2013",
        end: "2017",
      },
    ],
    skills: [
      { name: "TypeScript", level: "Expert" },
      { name: "React", level: "Expert" },
      { name: "Accessibility", level: "Advanced" },
    ],
    languages: [
      { name: "English", level: "C1", skills: ["C1", "C2", "C1"] },
      {
        name: "Lithuanian",
        level: "Native",
        skills: ["Native", "Native", "Native"],
      },
    ],
    references: [
      {
        company: "Example Corp",
        position: "Engineering Manager",
        name: "Sam Tester",
        phone: "+370 600 00066",
        email: "sam.tester@example.com",
      },
    ],
    salary: "3500 EUR gross per month",
    availability: "Available immediately",
    driving: "B",
    interests: "Climbing, film photography, and board games.",
  },
};
