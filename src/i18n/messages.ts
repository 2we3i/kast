import en from "../../messages/en.json";
import lt from "../../messages/lt.json";
import ru from "../../messages/ru.json";
import type { Locale } from "./routing";

export const MESSAGES: Record<Locale, typeof en> = { en, lt, ru };
