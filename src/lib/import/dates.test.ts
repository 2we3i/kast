import { describe, expect, it } from "vitest";
import { parseDateRange, parseSingleDate, withoutDate } from "./dates";
import {
  headingKind,
  isDurationBadge,
  isPageNumber,
  isPortalFurniture,
  languageLevel,
  levelBadge,
} from "./dictionary";

describe("parseDateRange", () => {
  it.each([
    ["2025.12 - 2026.06", "Dec 2025", "Jun 2026"],
    ["12/2025 – present", "Dec 2025", "Present"],
    ["2019-03 — 2021-11", "Mar 2019", "Nov 2021"],
    ["Jan 2020 – Mar 2021", "Jan 2020", "Mar 2021"],
    ["2018 – 2022", "2018", "2022"],
    ["sausis 2021 – iki dabar", "Jan 2021", "Present"],
    ["2020 m. rugsėjis – 2024 m. birželis", "Sep 2020", "Jun 2024"],
    ["январь 2020 — по настоящее время", "Jan 2020", "Present"],
    ["сентябрь 2015 – июнь 2019", "Sep 2015", "Jun 2019"],
    ["03.2017 - 08.2019", "Mar 2017", "Aug 2019"],
    ["2021 – н.в.", "2021", "Present"],
    ["May 2016 to Dec 2018", "May 2016", "Dec 2018"],
  ])("reads %s", (text, start, end) => {
    expect(parseDateRange(text)).toMatchObject({ start, end });
  });

  it("finds a range inside a longer line and cuts it out", () => {
    const line = "Acme Inc. | 2019 – 2021 | Vilnius";
    const range = parseDateRange(line);
    expect(range).toMatchObject({ start: "2019", end: "2021" });
    expect(withoutDate(line, range?.matched ?? "")).toBe("Acme Inc. | Vilnius");
  });

  it("ignores numbers that are not dates", () => {
    expect(parseDateRange("Cut costs by 1200-1500 EUR")).toBeNull();
    expect(parseDateRange("+370 600 12345")).toBeNull();
  });

  it("reads single dates", () => {
    expect(parseSingleDate("AWS Certified, 2023")?.date).toBe("2023");
    expect(parseSingleDate("issued 04/2022")?.date).toBe("Apr 2022");
  });
});

describe("dictionary", () => {
  it("knows headings in three languages", () => {
    expect(headingKind("Darbo patirtis")).toBe("experience");
    expect(headingKind("ОПЫТ РАБОТЫ:")).toBe("experience");
    expect(headingKind("Kompiuterinės žinios")).toBe("skills");
    expect(
      headingKind("Vairuotojo pažymėjimas / kategorija (neprivaloma):"),
    ).toBe("driving");
    expect(headingKind("Experienced engineer with ten years")).toBeNull();
  });

  it("recognizes badges and page furniture", () => {
    expect(isDurationBadge("6 mėnesiai")).toBe(true);
    expect(isDurationBadge("1 metai 2 mėnesiai")).toBe(true);
    expect(isDurationBadge("2 года 3 месяца")).toBe(true);
    expect(isDurationBadge("6 months")).toBe(true);
    expect(isDurationBadge("6 projects shipped")).toBe(false);
    expect(levelBadge("Lygis Įgudęs")).toBe("Įgudęs");
    expect(levelBadge("Уровень Продвинутый")).toBe("Продвинутый");
    expect(isPageNumber("2/3")).toBe(true);
    expect(isPageNumber("Puslapis 2 iš 3")).toBe(true);
    expect(isPageNumber("Страница 1")).toBe(true);
    expect(isPortalFurniture("CV sukurta su cvbankas.lt")).toBe(true);
    expect(isPortalFurniture("www.cv.lt")).toBe(true);
  });

  it("maps level words to CEFR", () => {
    expect(languageLevel("Vidutiniškai")).toBe("B1");
    expect(languageLevel("Puikiai")).toBe("C2");
    expect(languageLevel("свободно")).toBe("C1");
    expect(languageLevel("Upper-intermediate")).toBe("B2");
    expect(languageLevel("B2")).toBe("B2");
    expect(languageLevel("Gimtoji")).toBe("native");
  });
});
