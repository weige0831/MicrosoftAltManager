import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { convertDetectedLanguage } from "./languages";
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import ja from "./locales/ja.json";
import ru from "./locales/ru.json";
import vi from "./locales/vi.json";
import zhCN from "./locales/zh.json";
import zhTW from "./locales/zh-TW.json";

export const resources = {
  en: { translation: en },
  zhCN: { translation: zhCN },
  fr: { translation: fr },
  ru: { translation: ru },
  ja: { translation: ja },
  vi: { translation: vi },
  zhTW: { translation: zhTW },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "zhCN",
    supportedLngs: ["zhCN", "en", "fr", "ru", "ja", "vi", "zhTW"],
    load: "currentOnly",
    nsSeparator: false, // allow literal colons in keys
    keySeparator: false, // allow literal dots in keys (e.g. "home.navFeatures")
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "lang",
      convertDetectedLanguage,
    },
  });

export default i18n;
