import { b, li, p, plain, prose, t, ul } from "./seed-helpers";
import type { Resume } from "./types";
import { CURRENT_SCHEMA_VERSION } from "./types";

/**
 * The Lithuanian sample résumé: a fictional product designer in Vilnius. A
 * new résumé created with the Lithuanian interface starts from it. Every
 * contact is a placeholder on example.com; the phone is all zeros.
 */
export const SEED_RESUME_LT: Resume = {
  id: "seed-lt",
  schemaVersion: CURRENT_SCHEMA_VERSION,
  title: "Mano CV",
  templateId: "standard",
  language: "lt",
  atsMode: true,
  showIcons: true,
  sectionSpacing: 0,
  letterSpacing: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  header: {
    fields: {
      firstName: plain("Eglė"),
      lastName: plain("Pavyzdienė"),
      jobTitle: plain("Vyresnioji produkto dizainerė"),
      email: plain("egle.pavyzdiene@example.com"),
      phone: plain("+370 600 00000"),
      website: plain("egle.example.com"),
      linkedin: plain("linkedin.com/in/egle-pavyzdiene"),
      link: plain(""),
      city: plain("Vilnius"),
      province: plain(""),
      country: plain("Lietuva"),
    },
  },
  sections: [
    {
      id: "seed-lt-summary",
      type: "summary",
      title: "Summary",
      entries: [
        {
          id: "seed-lt-summary-1",
          fields: {
            body: prose(
              p(
                t("Produkto dizainerė, turinti "),
                b("7 metų"),
                t(
                  " patirtį finansų technologijų ir elektroninės prekybos srityse. Tyrimus paverčiu aiškiomis sąsajomis, kuriu dizaino sistemas ir glaudžiai dirbu su programuotojais, kad sprendimai pasiektų naudotojus greitai ir be klaidų.",
                ),
              ),
            ),
          },
        },
      ],
    },
    {
      id: "seed-lt-experience",
      type: "experience",
      title: "Experience",
      entries: [
        {
          id: "seed-lt-experience-1",
          fields: {
            title: plain("Vyresnioji produkto dizainerė"),
            company: plain("Šiaurės Mokėjimai UAB"),
            location: plain("Vilnius"),
            companyContext: plain(
              "Mokėjimų platforma 40 000 smulkiųjų verslų Baltijos šalyse",
            ),
            website: plain("mokejimai.example.com"),
            startDate: plain("Mar 2022"),
            endDate: plain("Present"),
            description: prose(
              ul(
                li(
                  t(
                    "Pertvarkiau naujų klientų registraciją ir sumažinau atsisakymų skaičių ",
                  ),
                  b("18 %"),
                  t("."),
                ),
                li(
                  t("Sukūriau dizaino sistemą su "),
                  b("120"),
                  t(" komponentų; naujų ekranų kūrimas pagreitėjo trečdaliu."),
                ),
                li(
                  t(
                    "Kas mėnesį atlieku naudotojų interviu ir prieinamumo patikras pagal WCAG 2.1 AA.",
                  ),
                ),
                li(t("Vadovauju dviem jaunesniesiems dizaineriams.")),
              ),
            ),
          },
        },
        {
          id: "seed-lt-experience-2",
          fields: {
            title: plain("Produkto dizainerė"),
            company: plain("Žalias Krepšelis UAB"),
            location: plain("Kaunas"),
            companyContext: plain(""),
            website: plain(""),
            startDate: plain("Sep 2019"),
            endDate: plain("Feb 2022"),
            description: prose(
              ul(
                li(
                  t(
                    "Perkūriau mobiliosios programėlės atsiskaitymo eigą; konversija išaugo ",
                  ),
                  b("12 %"),
                  t("."),
                ),
                li(
                  t(
                    "Įdiegiau A/B testavimo procesą ir kartu su analitikais apibrėžiau sėkmės rodiklius.",
                  ),
                ),
                li(
                  t(
                    "Paruošiau ženklodaros gaires ir iliustracijų rinkinį 3 rinkoms.",
                  ),
                ),
              ),
            ),
          },
        },
      ],
    },
    {
      id: "seed-lt-education",
      type: "education",
      title: "Education",
      entries: [
        {
          id: "seed-lt-education-1",
          fields: {
            institution: plain("Vilniaus dailės akademija"),
            degree: plain("Grafinio dizaino magistrė"),
            location: plain("Vilnius"),
            startDate: plain("2017"),
            endDate: plain("2019"),
            details: prose(
              p(
                t("Baigiamasis darbas apie skaitmeninių paslaugų prieinamumą."),
              ),
            ),
          },
        },
        {
          id: "seed-lt-education-2",
          fields: {
            institution: plain("Kauno technologijos universitetas"),
            degree: plain("Multimedijos technologijų bakalaurė"),
            location: plain("Kaunas"),
            startDate: plain("2013"),
            endDate: plain("2017"),
            details: prose(p(t(""))),
          },
        },
      ],
    },
    {
      id: "seed-lt-courses",
      type: "courses",
      title: "Courses",
      entries: [
        {
          id: "seed-lt-courses-1",
          fields: {
            title: plain("Naudotojų tyrimų pagrindai"),
            provider: plain("Coursera"),
            url: plain(""),
            startDate: plain("Jan 2023"),
            endDate: plain("Mar 2023"),
            description: prose(p(t(""))),
          },
        },
      ],
    },
    {
      id: "seed-lt-skills",
      type: "skills",
      title: "Skills",
      columns: 2,
      showProficiency: true,
      entries: [
        {
          id: "seed-lt-skills-1",
          fields: {
            name: plain("Figma"),
            level: plain("Expert"),
            description: plain("Dizaino sistemos, prototipai, kintamieji"),
          },
        },
        {
          id: "seed-lt-skills-2",
          fields: {
            name: plain("Naudotojų tyrimai"),
            level: plain("Advanced"),
          },
        },
        {
          id: "seed-lt-skills-3",
          fields: {
            name: plain("Prieinamumas (WCAG)"),
            level: plain("Advanced"),
          },
        },
        {
          id: "seed-lt-skills-4",
          fields: { name: plain("HTML ir CSS"), level: plain("Intermediate") },
        },
        {
          id: "seed-lt-skills-5",
          fields: {
            name: plain("Duomenų analizė"),
            level: plain("Intermediate"),
          },
        },
        {
          id: "seed-lt-skills-6",
          fields: {
            name: plain("Seminarų moderavimas"),
            level: plain("Advanced"),
          },
        },
      ],
    },
    {
      id: "seed-lt-languages",
      type: "languages",
      title: "Languages",
      columns: 2,
      showProficiency: true,
      entries: [
        {
          id: "seed-lt-languages-1",
          fields: {
            name: plain("Lietuvių"),
            level: plain("Native"),
            speaking: plain("native"),
            understanding: plain("native"),
            writing: plain("native"),
          },
        },
        {
          id: "seed-lt-languages-2",
          fields: {
            name: plain("Anglų"),
            level: plain("Fluent"),
            speaking: plain("C1"),
            understanding: plain("C2"),
            writing: plain("C1"),
          },
        },
        {
          id: "seed-lt-languages-3",
          fields: {
            name: plain("Rusų"),
            level: plain("Conversational"),
            speaking: plain("B1"),
            understanding: plain("B2"),
            writing: plain("A2"),
          },
        },
      ],
    },
    {
      id: "seed-lt-driving",
      type: "driving",
      title: "Driving licence",
      entries: [
        {
          id: "seed-lt-driving-1",
          fields: { categories: plain("B"), note: plain("") },
        },
      ],
    },
    {
      id: "seed-lt-availability",
      type: "availability",
      title: "Availability",
      entries: [
        {
          id: "seed-lt-availability-1",
          fields: {
            status: plain("notice"),
            from: plain(""),
            notice: plain("1 mėnuo"),
            workType: plain("Visu etatu, hibridinis"),
            relocation: plain("no"),
          },
        },
      ],
    },
  ],
};
