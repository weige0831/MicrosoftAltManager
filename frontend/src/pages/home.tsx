import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Boxes, Upload, Download, ShieldCheck, TimerReset, KeyRound, Activity,
  ArrowRight, Zap, Code, HeartHandshake, Settings, BarChart3, Lock,
  Github, Sun, Moon,
} from "lucide-react";
import { API, getStatus } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useTheme } from "@/context/theme-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Scroll-triggered reveal (IntersectionObserver)
function AnimateInView({ children, className, delay = 0, animation = "fade-up" }: { children: ReactNode; className?: string; delay?: number; animation?: "fade-up" | "scale-in" }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); ob.disconnect(); }
    }, { threshold: 0.15 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  const hidden = animation === "scale-in" ? "opacity-0 scale-95" : "opacity-0 translate-y-4";
  return (
    <div ref={ref} className={cn("transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none", shown ? "opacity-100 translate-y-0 scale-100" : hidden, className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// Count-up number
function Counter({ end, suffix = "", duration = 1600 }: { end: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.textContent = `${end}${suffix}`; return; }
    let started = false;
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) {
        started = true;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = `${Math.round(eased * end)}${suffix}`;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        ob.disconnect();
      }
    }, { threshold: 0.5 });
    ob.observe(el);
    return () => ob.disconnect();
  }, [end, suffix, duration]);
  return <span ref={ref} className="tabular-nums">0{suffix}</span>;
}

export default function HomePage() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.auth?.user);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [registerEnabled, setRegisterEnabled] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    API.setupStatus().then((r: any) => setNeedsSetup(r?.needs_setup ?? false)).catch(() => {});
    getStatus()
      .then((s) => setRegisterEnabled(!!(s?.register_enabled || s?.password_register_enabled)))
      .catch(() => {});
  }, []);

  // Scroll-triggered header morph
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const primaryTo = needsSetup ? "/setup" : user ? "/dashboard" : "/login";
  const primaryLabel = needsSetup ? t("home.initSystem") : user ? t("home.gotoConsole") : t("home.ctaPrimary");
  const navLinks = [
    { title: t("home.navFeatures"), href: "#features" },
    { title: t("home.navHow"), href: "#how" },
    { title: t("home.navApi"), href: "#api" },
  ];

  return (
    <div className="w-full bg-background text-foreground">
      {/* Floating morphing header (new-api pattern) */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div className={cn("pointer-events-auto mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]", scrolled ? "max-w-[52rem] px-3 pt-3" : "max-w-7xl px-4 md:px-6 pt-0")}>
          <nav className={cn("flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]", scrolled ? "h-12 rounded-2xl border border-border/50 bg-background/60 pl-4 pr-1.5 shadow-[0_2px_16px_-6px_rgba(0,0,0,0.08)] ring-1 ring-border/50 backdrop-blur-2xl dark:shadow-[0_2px_16px_-6px_rgba(0,0,0,0.4)]" : "h-16 px-2")}>
            <div className="flex shrink-0 items-center gap-2.5">
              <div className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Boxes className="size-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight">{t("appName")}</span>
            </div>
            <div className="flex items-center gap-0.5">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className={cn("rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors hover:text-foreground", "text-muted-foreground")}>
                  {l.title}
                </a>
              ))}
              <div className="mx-2 hidden h-4 w-px bg-border/40 sm:block" />
              <LanguageSwitcher />
              <button onClick={() => setTheme(isDark ? "light" : "dark")} className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <div className="mx-1 hidden h-4 w-px bg-border/40 sm:block" />
              {!user && !needsSetup && registerEnabled && (
                <Button size="sm" variant="ghost" className="h-8 rounded-lg px-3 text-xs font-medium" onClick={() => nav("/register")}>
                  {t("Sign up")}
                </Button>
              )}
              <Button size="sm" className="h-8 rounded-lg px-3.5 text-xs font-medium" onClick={() => nav(primaryTo)}>
                {primaryLabel}
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 overflow-hidden px-6 pb-16 pt-24 md:pb-24 md:pt-32 lg:pb-28 lg:pt-36">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-25 dark:opacity-[0.12]"
          style={{ background: "radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.72 0.18 250 / 80%) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 15%, oklch(0.65 0.15 200 / 60%) 0%, transparent 70%), radial-gradient(ellipse 40% 35% at 40% 80%, oklch(0.70 0.12 280 / 40%) 0%, transparent 70%)" }} />
        {/* Grid pattern */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_20%,transparent_100%)] bg-[size:4rem_4rem] opacity-[0.08]" />
        <div className="mx-auto max-w-6xl">
          <div className="landing-animate-fade-up mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400" style={{ animationDelay: "0ms" }}>
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-blue-500" />
            </span>
            {t("home.badge")}
          </div>
          <h1 className="landing-animate-fade-up text-[clamp(2.25rem,4.5vw,3.25rem)] font-bold leading-[1.15] tracking-tight" style={{ animationDelay: "60ms" }}>
            {t("home.heroTitle1")}<br />
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">{t("home.heroTitle2")}</span>
          </h1>
          <p className="landing-animate-fade-up mt-5 max-w-xl text-base leading-relaxed text-muted-foreground/80 md:text-[15px]" style={{ animationDelay: "120ms" }}>{t("home.heroDesc")}</p>
          <div className="landing-animate-fade-up mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "180ms" }}>
            <Button className="group h-11 rounded-lg px-5 text-sm font-medium" onClick={() => nav(primaryTo)}>{primaryLabel}<ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" /></Button>
            <Button variant="outline" className="h-11 rounded-lg px-5 text-sm font-medium" onClick={() => nav("/login")}>{t("home.ctaSecondary")}</Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="border-y border-border/40 bg-muted/10">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4 md:gap-12">
          {[{ e: 256, s: "-bit", l: t("home.stats1") }, { e: 100, s: "%", l: t("home.stats2") }, { e: 7, s: "x24", l: t("home.stats3") }, { e: 99, s: "%", l: t("home.stats4") }].map((s) => (
            <div key={s.l} className="flex flex-col items-center text-center">
              <span className="text-2xl font-bold tracking-tight md:text-3xl"><Counter end={s.e} suffix={s.s} /></span>
              <span className="mt-1.5 text-xs text-muted-foreground">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <AnimateInView className="mb-16 max-w-lg">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">{t("home.featuresEyebrow")}</p>
            <h2 className="whitespace-pre-line text-2xl font-bold tracking-tight md:text-3xl">{t("home.featuresTitle")}</h2>
          </AnimateInView>
          <div className="grid gap-px overflow-hidden rounded-xl border border-border/40 bg-border/40 md:grid-cols-3">
            {[
              { n: "01", s: "md:col-span-2", i: <Upload className="size-4 text-blue-400" />, t: t("accounts.uploadAccount"), d: t("accounts.uploadDesc") },
              { n: "02", s: "md:col-span-1", i: <ShieldCheck className="size-4 text-emerald-400" />, t: "AES-256-GCM", d: t("home.heroDesc").substring(0, 50) },
              { n: "03", s: "md:col-span-1", i: <Download className="size-4 text-violet-400" />, t: t("accounts.extractAccount"), d: t("accounts.extractDesc") },
              { n: "04", s: "md:col-span-2", i: <Code className="size-4 text-amber-400" />, t: t("home.navApi"), d: t("home.heroDesc").substring(0, 50) },
            ].map((f, i) => (
              <AnimateInView key={f.n} delay={i * 100} animation="scale-in" className={cn("group bg-background p-7 transition-colors hover:bg-muted/20 md:p-8", f.s)}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-md border border-border/40 bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">{f.n}</span>
                  <h3 className="text-sm font-semibold">{f.t}</h3>
                  <span className="ml-auto">{f.i}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.d}</p>
              </AnimateInView>
            ))}
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            {[
              { i: <TimerReset className="size-5" strokeWidth={1.5} />, t: t("dashboard.cleanupPolicy"), d: t("dashboard.ttlAfterExtract") },
              { i: <KeyRound className="size-5" strokeWidth={1.5} />, t: t("apikeys.title"), d: t("apikeys.desc") },
              { i: <Activity className="size-5" strokeWidth={1.5} />, t: t("logs.title"), d: t("logs.desc") },
              { i: <HeartHandshake className="size-5" strokeWidth={1.5} />, t: "Open Source", d: "Self-hosted" },
            ].map((f, i) => (
              <AnimateInView key={i} delay={i * 100} className="group flex flex-col items-center text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-border/50 bg-muted/30 text-muted-foreground transition-colors group-hover:text-foreground">{f.i}</div>
                <h3 className="mb-1.5 text-sm font-semibold">{f.t}</h3>
                <p className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">{f.d}</p>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <AnimateInView className="mb-16 text-center md:mb-20">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">{t("home.howEyebrow")}</p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("home.howTitle")}</h2>
          </AnimateInView>
          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {[
              { n: "1", icon: <Settings className="size-6" strokeWidth={1.5} />, t: t("setup.title"), d: t("setup.description") },
              { n: "2", icon: <Zap className="size-6" strokeWidth={1.5} />, t: t("accounts.uploadAccount"), d: t("accounts.uploadDesc") },
              { n: "3", icon: <BarChart3 className="size-6" strokeWidth={1.5} />, t: t("dashboard.cleanupPolicy"), d: t("dashboard.ttlAfterExtract") },
            ].map((s, i) => (
              <AnimateInView key={s.n} delay={i * 150} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-muted/30 text-muted-foreground transition-colors">{s.icon}</div>
                  <div className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{s.n}</div>
                </div>
                <h3 className="mb-2 text-base font-semibold">{s.t}</h3>
                <p className="max-w-[240px] text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </AnimateInView>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 overflow-hidden px-6 py-24 md:py-32">
        <div aria-hidden className="absolute inset-0 -z-10 opacity-20 dark:opacity-[0.08]"
          style={{ background: "radial-gradient(ellipse 50% 50% at 30% 50%, oklch(0.7 0.15 250 / 70%) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 70% 40%, oklch(0.65 0.12 200 / 50%) 0%, transparent 70%)" }} />
        <AnimateInView className="mx-auto max-w-2xl text-center" animation="scale-in">
          <h2 className="whitespace-pre-line text-2xl font-bold tracking-tight md:text-4xl">{t("home.ctaTitle1") + "\n" + t("home.ctaTitle2")}</h2>
          <p className="mx-auto mt-5 max-w-md text-sm text-muted-foreground/80 md:text-base">{t("home.ctaDesc")}</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button className="group rounded-lg" onClick={() => nav(primaryTo)}>{primaryLabel}<ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5" /></Button>
            <Button variant="outline" className="rounded-lg" onClick={() => nav("/login")}>{t("action.login")}</Button>
          </div>
        </AnimateInView>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid size-5 place-items-center rounded bg-primary text-primary-foreground"><Boxes className="size-3.5" /></div>
            <span>© {new Date().getFullYear()} weige0831</span>
          </div>
          <a href="https://github.com/weige0831/MicrosoftAltManager" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
            <Github className="size-3.5" /> GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
