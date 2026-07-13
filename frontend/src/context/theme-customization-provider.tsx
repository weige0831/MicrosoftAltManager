import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CONTENT_LAYOUT_VALUES,
  type ContentLayout,
  DEFAULT_THEME_CUSTOMIZATION,
  resolveThemeFont,
  THEME_COOKIE_KEYS,
  THEME_FONT_VALUES,
  THEME_PRESET_VALUES,
  THEME_RADIUS_VALUES,
  THEME_SCALE_VALUES,
  type ThemeCustomization,
  type ThemeFont,
  type ThemePreset,
  type ThemeRadius,
  type ThemeScale,
} from "@/lib/theme-customization";

function readStored<T extends string>(
  name: string,
  allowed: ReadonlySet<T>,
  fallback: T,
): T {
  if (typeof localStorage === "undefined") return fallback;
  const value = localStorage.getItem(name);
  return value && allowed.has(value as T) ? (value as T) : fallback;
}

function applyAttribute(name: string, value: string | null) {
  if (typeof document === "undefined") return;
  const body = document.body;
  if (!body) return;
  if (value === null) body.removeAttribute(name);
  else body.setAttribute(name, value);
}

type Ctx = {
  defaults: ThemeCustomization;
  customization: ThemeCustomization;
  setPreset: (v: ThemePreset) => void;
  setFont: (v: ThemeFont) => void;
  setRadius: (v: ThemeRadius) => void;
  setScale: (v: ThemeScale) => void;
  setContentLayout: (v: ContentLayout) => void;
  resetCustomization: () => void;
};

const FALLBACK: Ctx = {
  defaults: DEFAULT_THEME_CUSTOMIZATION,
  customization: DEFAULT_THEME_CUSTOMIZATION,
  setPreset: () => {},
  setFont: () => {},
  setRadius: () => {},
  setScale: () => {},
  setContentLayout: () => {},
  resetCustomization: () => {},
};

const ThemeCustomizationContext = createContext<Ctx>(FALLBACK);

export function ThemeCustomizationProvider(props: { children: React.ReactNode }) {
  const [preset, _setPreset] = useState<ThemePreset>(() =>
    readStorage<ThemePreset>(THEME_COOKIE_KEYS.preset, THEME_PRESET_VALUES, DEFAULT_THEME_CUSTOMIZATION.preset),
  );
  const [font, _setFont] = useState<ThemeFont>(() =>
    readStorage<ThemeFont>(THEME_COOKIE_KEYS.font, THEME_FONT_VALUES, DEFAULT_THEME_CUSTOMIZATION.font),
  );
  const [radius, _setRadius] = useState<ThemeRadius>(() =>
    readStorage<ThemeRadius>(THEME_COOKIE_KEYS.radius, THEME_RADIUS_VALUES, DEFAULT_THEME_CUSTOMIZATION.radius),
  );
  const [scale, _setScale] = useState<ThemeScale>(() =>
    readStorage<ThemeScale>(THEME_COOKIE_KEYS.scale, THEME_SCALE_VALUES, DEFAULT_THEME_CUSTOMIZATION.scale),
  );
  const [contentLayout, _setContentLayout] = useState<ContentLayout>(() =>
    readStorage<ContentLayout>(THEME_COOKIE_KEYS.contentLayout, CONTENT_LAYOUT_VALUES, DEFAULT_THEME_CUSTOMIZATION.contentLayout),
  );

  // mirror state -> <body data-*> so theme-presets.css cascade kicks in
  useEffect(() => {
    applyAttribute("data-theme-preset", preset === DEFAULT_THEME_CUSTOMIZATION.preset ? null : preset);
  }, [preset]);
  useEffect(() => {
    applyAttribute("data-theme-font", resolveThemeFont(font, preset));
  }, [font, preset]);
  useEffect(() => {
    applyAttribute("data-theme-radius", radius === DEFAULT_THEME_CUSTOMIZATION.radius ? null : radius);
  }, [radius]);
  useEffect(() => {
    applyAttribute("data-theme-scale", scale === DEFAULT_THEME_CUSTOMIZATION.scale ? null : scale);
  }, [scale]);
  useEffect(() => {
    applyAttribute("data-theme-content-layout", contentLayout === DEFAULT_THEME_CUSTOMIZATION.contentLayout ? null : contentLayout);
  }, [contentLayout]);

  const persist = useCallback((key: string, value: string, isDefault: boolean) => {
    if (isDefault) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }, []);

  const setPreset = useCallback((v: ThemePreset) => {
    _setPreset(v);
    persist(THEME_COOKIE_KEYS.preset, v, v === DEFAULT_THEME_CUSTOMIZATION.preset);
  }, [persist]);
  const setFont = useCallback((v: ThemeFont) => {
    _setFont(v);
    persist(THEME_COOKIE_KEYS.font, v, v === DEFAULT_THEME_CUSTOMIZATION.font);
  }, [persist]);
  const setRadius = useCallback((v: ThemeRadius) => {
    _setRadius(v);
    persist(THEME_COOKIE_KEYS.radius, v, v === DEFAULT_THEME_CUSTOMIZATION.radius);
  }, [persist]);
  const setScale = useCallback((v: ThemeScale) => {
    _setScale(v);
    persist(THEME_COOKIE_KEYS.scale, v, v === DEFAULT_THEME_CUSTOMIZATION.scale);
  }, [persist]);
  const setContentLayout = useCallback((v: ContentLayout) => {
    _setContentLayout(v);
    persist(THEME_COOKIE_KEYS.contentLayout, v, v === DEFAULT_THEME_CUSTOMIZATION.contentLayout);
  }, [persist]);
  const resetCustomization = useCallback(() => {
    setPreset(DEFAULT_THEME_CUSTOMIZATION.preset);
    setFont(DEFAULT_THEME_CUSTOMIZATION.font);
    setRadius(DEFAULT_THEME_CUSTOMIZATION.radius);
    setScale(DEFAULT_THEME_CUSTOMIZATION.scale);
    setContentLayout(DEFAULT_THEME_CUSTOMIZATION.contentLayout);
  }, [setPreset, setFont, setRadius, setScale, setContentLayout]);

  const value = useMemo<Ctx>(
    () => ({
      defaults: DEFAULT_THEME_CUSTOMIZATION,
      customization: { preset, font, radius, scale, contentLayout },
      setPreset,
      setFont,
      setRadius,
      setScale,
      setContentLayout,
      resetCustomization,
    }),
    [preset, font, radius, scale, contentLayout, setPreset, setFont, setRadius, setScale, setContentLayout, resetCustomization],
  );

  return <ThemeCustomizationContext.Provider value={value}>{props.children}</ThemeCustomizationContext.Provider>;
}

// alias kept for parity with new-api naming
function readStorage<T extends string>(name: string, allowed: ReadonlySet<T>, fallback: T): T {
  return readStored(name, allowed, fallback);
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeCustomization() {
  return useContext(ThemeCustomizationContext);
}
