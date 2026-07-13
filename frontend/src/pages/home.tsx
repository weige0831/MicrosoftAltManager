import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Boxes,
  Upload,
  Download,
  ShieldCheck,
  TimerReset,
  KeyRound,
  Activity,
  ArrowRight,
  Zap,
  Code,
  HeartHandshake,
  Settings,
  BarChart3,
  Lock,
  Terminal,
  Github,
} from "lucide-react";
import { API } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { PublicHeader } from "@/components/layout/components/public-header";
import { FadeIn } from "@/components/page-transition";
import { Button } from "@/components/ui/button";

/* count-up number, mirrors new-api Stats/Counter */
function Counter({ end, suffix = "", duration = 1600 }: { end: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.textContent = `${end}${suffix}`;
      return;
    }
    let started = false;
    const ob = new IntersectionObserver(
      ([e]) => {
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
      },
      { threshold: 0.5 },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [end, suffix, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      0{suffix}
    </span>
  );
}

export default function HomePage() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.auth?.user);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [brand, setBrand] = useState("微软账号管理器");

  useEffect(() => {
    API.setupStatus().then((r) => setNeedsSetup(r.needs_setup)).catch(() => {});
    fetch("/api/settings")
      .then((r) => r.json())
      .then((e) => e.data?.brand_name && setBrand(e.data.brand_name))
      .catch(() => {});
  }, []);

  const primaryTo = needsSetup ? "/setup" : user ? "/dashboard" : "/login";
  const primaryLabel = needsSetup ? t("home.initSystem") : user ? t("home.gotoConsole") : t("home.ctaPrimary");
  const secondaryLabel = needsSetup ? t("action.login") : user ? "" : t("home.ctaSecondary");

  return (
    <div className="w-full bg-background text-foreground">
      <PublicHeader needsSetup={needsSetup} />

      {/* ===== Hero ===== */}
      <section className="relative z-10 overflow-hidden px-6 pb-16 pt-24 md:pb-24 md:pt-32 lg:pb-28 lg:pt-36">
        {/* radial gradient + grid bg */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-25 dark:opacity-[0.12]"
          style={{
            background: [
              "radial-gradient(ellipse 60% 50% at 20% 20%, oklch(0.72 0.18 250 / 80%) 0%, transparent 70%)",
              "radial-gradient(ellipse 50% 40% at 80% 15%, oklch(0.65 0.15 200 / 60%) 0%, transparent 70%)",
              "radial-gradient(ellipse 40% 35% at 40% 80%, oklch(0.70 0.12 280 / 40%) 0%, transparent 70%)",
            ].join(", "),
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black_20%,transparent_100%)] bg-[size:4rem_4rem] opacity-[0.08]"
        />

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-8">
          {/* left */}
          <div className="flex flex-col items-start text-left lg:col-span-6">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-[11px] font-medium text-blue-600 shadow-xs dark:border-blue-400/20 dark:bg-blue-400/5 dark:text-blue-400">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
              </span>
              {t("home.badge")}
            </div>

            <h1 className="text-[clamp(2.25rem,4.5vw,3.25rem)] font-bold leading-[1.15] tracking-tight">
              {t("home.heroTitle1")}
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-500 bg-clip-text text-transparent">
                {t("home.heroTitle2")}
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground/80 md:text-[15px]">
              {t("home.heroDesc")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button className="group h-11 rounded-lg px-5 text-sm font-medium" onClick={() => nav(primaryTo)}>
                {primaryLabel}
                <ArrowRight className="ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-lg border-border/50 px-5 text-sm font-medium hover:border-border hover:bg-muted/50"
                onClick={() => nav("/login")}
              >
                {t("home.ctaSecondary")}
              </Button>
            </div>

            {/* supported: tech pills */}
            <div className="mt-10 w-full max-w-xl">
              <div className="mb-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/50">
                  {t("home.techStack")}
                </span>
                <p className="text-xs leading-relaxed text-muted-foreground/60">
                  {t("home.techStackDesc")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { t: "Go + Gin", c: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                  { t: "PostgreSQL", c: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                  { t: "AES-256-GCM", c: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
                  { t: "React 19", c: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                ].map((p) => (
                  <div
                    key={p.t}
                    className={`flex items-center gap-2.5 rounded-full border border-border/40 bg-muted/15 px-5 py-2.5 text-sm font-medium text-foreground/80 backdrop-blur-xs transition-all duration-300 hover:scale-[1.02] hover:border-border hover:bg-muted/30 hover:text-foreground ${p.c}`}
                  >
                    <span className="size-2 rounded-full bg-current opacity-70" />
                    {p.t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* right: terminal demo */}
          <div className="flex w-full justify-center lg:col-span-6">
            <div className="mt-8 w-full max-w-md lg:mt-0">
              <div className="overflow-hidden rounded-xl border bg-zinc-950 text-zinc-100 shadow-2xl">
                <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
                  <span className="size-3 rounded-full bg-red-500/80" />
                  <span className="size-3 rounded-full bg-yellow-500/80" />
                  <span className="size-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 flex items-center gap-1 text-xs text-zinc-400">
                    <Terminal className="size-3" /> extract.sh
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 text-[11px] leading-relaxed text-zinc-300 md:text-xs">
                  <code>{`# 提取 5 个可用账号
curl -X POST \\
  ${typeof location !== "undefined" ? location.origin : "http://<ip>:27321"}/api/account/extract \\
  -H "Authorization: Bearer msm_xxx" \\
  -d '{"count":5}'

{
  "success": true,
  "data": {
    "count": 5,
    "items": [
      { "username": "...", "password": "...",
        "cookie": "...",
        "refresh_tokens": [{"app_name":"xbox","refresh_token":"..."}] },
      ...
    ]
  }
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <div className="relative z-10 border-y border-border/40 bg-muted/10">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            {[
              { end: 256, suffix: "-bit", label: t("home.stats1") },
              { end: 100, suffix: "%", label: t("home.stats2") },
              { end: 7, suffix: "x24", label: t("home.stats3") },
              { end: 99, suffix: "%", label: t("home.stats4") },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center text-center">
                <span className="text-2xl font-bold tracking-tight md:text-3xl">
                  <Counter end={s.end} suffix={s.suffix} />
                </span>
                <span className="mt-1.5 text-xs text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Features (bento grid) ===== */}
      <section className="relative z-10 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="mb-16 max-w-lg">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t("home.featuresEyebrow")}
            </p>
            <h2 className="whitespace-pre-line text-2xl font-bold leading-tight tracking-tight md:text-3xl">
              {t("home.featuresTitle")}
            </h2>
          </FadeIn>

          {/* bento */}
          <div className="grid gap-px overflow-hidden rounded-xl border border-border/40 bg-border/40 md:grid-cols-3">
            {[
              {
                num: "01", span: "md:col-span-2", icon: <Upload className="size-4 text-blue-400" />,
                title: "灵活上传",
                desc: "账密、Cookie 必填，备注与多应用 RefreshToken 可选，支持单条与批量。",
                visual: (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {["用户名", "密码", "Cookie", "备注", "RefreshToken", "批量"].map((n) => (
                      <div key={n} className="flex items-center justify-center rounded-lg border border-border/30 bg-muted/20 px-3 py-2 text-xs text-muted-foreground transition-colors duration-300 hover:border-blue-500/30 hover:bg-blue-500/5">
                        {n}
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                num: "02", span: "md:col-span-1", icon: <ShieldCheck className="size-4 text-emerald-400" />,
                title: "加密存储",
                desc: "敏感字段 AES-256-GCM 加密落库，列表脱敏。",
                visual: (
                  <div className="mt-4 flex items-center justify-center">
                    <div className="relative">
                      <div className="flex size-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                        <Lock className="size-7 text-emerald-500/70" strokeWidth={1.5} />
                      </div>
                      <div className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-emerald-500">
                        <svg className="size-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ),
              },
              {
                num: "03", span: "md:col-span-1", icon: <Download className="size-4 text-violet-400" />,
                title: "按序提取",
                desc: "FIFO 提取，不可二次提取。",
                visual: (
                  <div className="mt-4 space-y-2">
                    {["数量筛选", "时间筛选", "应用筛选"].map((step, i) => (
                      <div key={step} className="flex items-center gap-2">
                        <div className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${
                          i === 1 ? "border border-blue-500/30 bg-blue-500/20 text-blue-500" : "border border-border/40 bg-muted text-muted-foreground"
                        }`}>{i + 1}</div>
                        <div className="h-px flex-1 bg-border/40" />
                        <span className="text-xs text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                num: "04", span: "md:col-span-2", icon: <Code className="size-4 text-amber-400" />,
                title: "为开发者友好",
                desc: "统一 REST 信封，API Key 分权，无缝接入自动化流水线。",
                visual: (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {["API", "SDK", "CLI", "Hook"].map((n) => (
                        <div key={n} className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-muted to-muted/60 text-[9px] font-bold text-muted-foreground">
                          {n}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Code className="size-3.5 text-blue-500" />
                      标准 REST 接口
                    </div>
                  </div>
                ),
              },
            ].map((f) => (
              <FadeIn key={f.num} className={`group bg-background p-7 transition-colors duration-300 hover:bg-muted/20 md:p-8 ${f.span}`}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-md border border-border/40 bg-muted text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {f.num}
                  </span>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <span className="ml-auto">{f.icon}</span>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                {f.visual}
              </FadeIn>
            ))}
          </div>

          {/* additional features */}
          <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            {[
              { icon: <TimerReset className="size-5" strokeWidth={1.5} />, t: "自动过期", d: "提取后倒计时删除" },
              { icon: <KeyRound className="size-5" strokeWidth={1.5} />, t: "API Key", d: "分权签发可吊销" },
              { icon: <Activity className="size-5" strokeWidth={1.5} />, t: "审计日志", d: "全量操作可追溯" },
              { icon: <HeartHandshake className="size-5" strokeWidth={1.5} />, t: "开源自托管", d: "数据完全自控" },
            ].map((f, i) => (
              <FadeIn key={f.t} delay={i * 100} className="group flex flex-col items-center text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-border/50 bg-muted/30 text-muted-foreground transition-colors group-hover:text-foreground">
                  {f.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold">{f.t}</h3>
                <p className="max-w-[200px] text-xs leading-relaxed text-muted-foreground">{f.d}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How it works ===== */}
      <section className="relative z-10 border-t border-border/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="mb-16 text-center md:mb-20">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {t("home.howEyebrow")}
            </p>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("home.howTitle")}</h2>
          </FadeIn>

          <div className="grid gap-8 md:grid-cols-3 md:gap-12">
            {[
              { n: "1", icon: <Settings className="size-6" strokeWidth={1.5} />, t: "初始化", d: "首次访问配置管理员账号，无需任何默认密码。" },
              { n: "2", icon: <Zap className="size-6" strokeWidth={1.5} />, t: "上传 / 提取", d: "网页表单或 API Key 调用接口完成账号流转。" },
              { n: "3", icon: <BarChart3 className="size-6" strokeWidth={1.5} />, t: "自动过期", d: "提取后按 TTL 倒计时删除，后台全程审计。" },
            ].map((s, i) => (
              <FadeIn key={s.n} delay={i * 150} className="relative flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-muted/30 text-muted-foreground transition-colors">
                    {s.icon}
                  </div>
                  <div className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
                    {s.n}
                  </div>
                </div>
                <h3 className="mb-2 text-base font-semibold">{s.t}</h3>
                <p className="max-w-[240px] text-sm leading-relaxed text-muted-foreground">{s.d}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative z-10 overflow-hidden px-6 py-24 md:py-32">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-20 dark:opacity-[0.08]"
          style={{
            background: [
              "radial-gradient(ellipse 50% 50% at 30% 50%, oklch(0.7 0.15 250 / 70%) 0%, transparent 70%)",
              "radial-gradient(ellipse 40% 40% at 70% 40%, oklch(0.65 0.12 200 / 50%) 0%, transparent 70%)",
            ].join(", "),
          }}
        />
        <FadeIn className="mx-auto max-w-2xl text-center" animation="scale-in">
          <h2 className="whitespace-pre-line text-2xl font-bold leading-tight tracking-tight md:text-4xl">
            {t("home.ctaTitle1") + "\n" + t("home.ctaTitle2")}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-muted-foreground/80 md:text-base">
            {t("home.ctaDesc")}
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button className="group rounded-lg" onClick={() => nav(primaryTo)}>
              {primaryLabel}
              <ArrowRight className="ml-1 size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Button>
            <Button
              variant="outline"
              className="rounded-lg border-border/50 hover:border-border hover:bg-muted/50"
              onClick={() => nav("/login")}
            >
              {t("action.login")}
            </Button>
          </div>
        </FadeIn>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid size-5 place-items-center rounded bg-primary text-primary-foreground">
              <Boxes className="size-3.5" />
            </div>
            <span>{brand}</span>
            <span className="text-muted-foreground/50">· © {new Date().getFullYear()} weige0831</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/weige0831/MicrosoftAltManager"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Github className="size-3.5" />
              GitHub
            </a>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground/50">Contains theme code from New API (AGPLv3)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
