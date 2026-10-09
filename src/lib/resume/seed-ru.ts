import { b, li, p, plain, prose, t, ul } from "./seed-helpers";
import type { Resume } from "./types";
import { CURRENT_SCHEMA_VERSION } from "./types";

/**
 * The Russian sample résumé: a fictional logistics manager in Klaipėda. A new
 * résumé created with the Russian interface starts from it. Every contact is
 * a placeholder on example.com; the phone is all zeros.
 */
export const SEED_RESUME_RU: Resume = {
  id: "seed-ru",
  schemaVersion: CURRENT_SCHEMA_VERSION,
  title: "Моё резюме",
  templateId: "standard",
  language: "ru",
  atsMode: true,
  showIcons: true,
  sectionSpacing: 0,
  letterSpacing: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  header: {
    fields: {
      firstName: plain("Алёна"),
      lastName: plain("Примерова"),
      jobTitle: plain("Менеджер по логистике"),
      email: plain("alena.primerova@example.com"),
      phone: plain("+370 600 00000"),
      website: plain(""),
      linkedin: plain("linkedin.com/in/alena-primerova"),
      link: plain(""),
      city: plain("Клайпеда"),
      province: plain(""),
      country: plain("Литва"),
    },
  },
  sections: [
    {
      id: "seed-ru-summary",
      type: "summary",
      title: "Summary",
      entries: [
        {
          id: "seed-ru-summary-1",
          fields: {
            body: prose(
              p(
                t("Менеджер по логистике с опытом "),
                b("8 лет"),
                t(
                  " в международных автомобильных и морских перевозках. Выстраиваю цепочки поставок между Балтией, Скандинавией и Центральной Европой, сокращаю сроки и затраты, веду переговоры с перевозчиками и таможенными брокерами.",
                ),
              ),
            ),
          },
        },
      ],
    },
    {
      id: "seed-ru-experience",
      type: "experience",
      title: "Experience",
      entries: [
        {
          id: "seed-ru-experience-1",
          fields: {
            title: plain("Менеджер по логистике"),
            company: plain("Балтийский Транзит UAB"),
            location: plain("Клайпеда"),
            companyContext: plain(
              "Экспедитор: 1 200 отправок в месяц по 14 странам",
            ),
            website: plain("tranzit.example.com"),
            startDate: plain("Apr 2021"),
            endDate: plain("Present"),
            description: prose(
              ul(
                li(
                  t(
                    "Перестроила график отгрузок через порт и сократила простой контейнеров на ",
                  ),
                  b("22 %"),
                  t("."),
                ),
                li(
                  t("Провела тендер среди перевозчиков и снизила ставки на "),
                  b("9 %"),
                  t(" при прежнем уровне сервиса."),
                ),
                li(
                  t(
                    "Внедрила отслеживание грузов в TMS и еженедельную отчётность для клиентов.",
                  ),
                ),
                li(t("Руковожу группой из трёх координаторов.")),
              ),
            ),
          },
        },
        {
          id: "seed-ru-experience-2",
          fields: {
            title: plain("Координатор перевозок"),
            company: plain("Северная Экспедиция UAB"),
            location: plain("Вильнюс"),
            companyContext: plain(""),
            website: plain(""),
            startDate: plain("Jun 2017"),
            endDate: plain("Mar 2021"),
            description: prose(
              ul(
                li(
                  t("Планировала до "),
                  b("60 рейсов"),
                  t(" в неделю по маршрутам ЕС и Великобритании."),
                ),
                li(
                  t(
                    "Готовила CMR, инвойсы и документы для таможенного оформления.",
                  ),
                ),
                li(
                  t(
                    "Решала нештатные ситуации на маршруте и держала клиентов в курсе.",
                  ),
                ),
              ),
            ),
          },
        },
      ],
    },
    {
      id: "seed-ru-education",
      type: "education",
      title: "Education",
      entries: [
        {
          id: "seed-ru-education-1",
          fields: {
            institution: plain("Клайпедский университет"),
            degree: plain("Бакалавр, логистика и транспортный менеджмент"),
            location: plain("Клайпеда"),
            startDate: plain("2013"),
            endDate: plain("2017"),
            details: prose(p(t(""))),
          },
        },
      ],
    },
    {
      id: "seed-ru-certifications",
      type: "certifications",
      title: "Certifications",
      entries: [
        {
          id: "seed-ru-certifications-1",
          fields: {
            name: plain("Специалист по таможенному оформлению"),
            issuer: plain("Учебный центр (пример)"),
            url: plain(""),
            date: plain("May 2020"),
          },
        },
      ],
    },
    {
      id: "seed-ru-skills",
      type: "skills",
      title: "Skills",
      columns: 2,
      showProficiency: true,
      entries: [
        {
          id: "seed-ru-skills-1",
          fields: {
            name: plain("Планирование перевозок"),
            level: plain("Expert"),
            description: plain("FTL, LTL, контейнерные и мультимодальные"),
          },
        },
        {
          id: "seed-ru-skills-2",
          fields: {
            name: plain("Таможенные процедуры ЕС"),
            level: plain("Advanced"),
          },
        },
        {
          id: "seed-ru-skills-3",
          fields: {
            name: plain("TMS и ERP-системы"),
            level: plain("Advanced"),
          },
        },
        {
          id: "seed-ru-skills-4",
          fields: {
            name: plain("Excel, сводные таблицы"),
            level: plain("Advanced"),
          },
        },
        {
          id: "seed-ru-skills-5",
          fields: {
            name: plain("Переговоры с подрядчиками"),
            level: plain("Advanced"),
          },
        },
        {
          id: "seed-ru-skills-6",
          fields: { name: plain("Incoterms 2020"), level: plain("Expert") },
        },
      ],
    },
    {
      id: "seed-ru-languages",
      type: "languages",
      title: "Languages",
      columns: 2,
      showProficiency: true,
      entries: [
        {
          id: "seed-ru-languages-1",
          fields: {
            name: plain("Русский"),
            level: plain("Native"),
            speaking: plain("native"),
            understanding: plain("native"),
            writing: plain("native"),
          },
        },
        {
          id: "seed-ru-languages-2",
          fields: {
            name: plain("Литовский"),
            level: plain("Professional"),
            speaking: plain("B2"),
            understanding: plain("C1"),
            writing: plain("B2"),
          },
        },
        {
          id: "seed-ru-languages-3",
          fields: {
            name: plain("Английский"),
            level: plain("Professional"),
            speaking: plain("B2"),
            understanding: plain("B2"),
            writing: plain("B1"),
          },
        },
      ],
    },
    {
      id: "seed-ru-driving",
      type: "driving",
      title: "Driving licence",
      entries: [
        {
          id: "seed-ru-driving-1",
          fields: { categories: plain("B, C"), note: plain("Стаж 10 лет") },
        },
      ],
    },
    {
      id: "seed-ru-salary",
      type: "salary",
      title: "Expected salary",
      entries: [
        {
          id: "seed-ru-salary-1",
          fields: {
            amount: plain("2400"),
            currency: plain("EUR"),
            period: plain("month"),
            tax: plain("gross"),
          },
        },
      ],
    },
    {
      id: "seed-ru-availability",
      type: "availability",
      title: "Availability",
      entries: [
        {
          id: "seed-ru-availability-1",
          fields: {
            status: plain("notice"),
            from: plain(""),
            notice: plain("2 недели"),
            workType: plain("Полная занятость"),
            relocation: plain("yes"),
          },
        },
      ],
    },
  ],
};
