export const INTERFACE_LANGUAGE_OPTIONS = [
  { code: "zhCN", label: "简体中文" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "zhTW", label: "繁體中文" },
] as const;

export type InterfaceLanguageCode = (typeof INTERFACE_LANGUAGE_OPTIONS)[number]["code"];

/** Map a browser-detected BCP-47 locale onto our interface codes (zhCN/zhTW). */
export function convertDetectedLanguage(value: string): string {
  const lower = value.trim().replaceAll("_", "-").toLowerCase();
  if (!lower.startsWith("zh")) return value;
  if (
    lower === "zh-tw" ||
    lower === "zh-hk" ||
    lower === "zh-mo" ||
    lower.startsWith("zh-hant")
  ) {
    return "zhTW";
  }
  return "zhCN";
}

/** Convert an interface code (zhCN/zhTW) to a BCP-47 tag for Intl APIs. */
export function toIntlLocale(value?: string | null): string | undefined {
  if (!value) return undefined;
  if (value === "zhCN") return "zh-CN";
  if (value === "zhTW") return "zh-TW";
  try {
    return Intl.getCanonicalLocales(value)[0];
  } catch {
    return undefined;
  }
}
