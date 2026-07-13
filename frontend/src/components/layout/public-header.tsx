import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Boxes, Sun, Moon, Palette } from "lucide-react";
import { useAuth } from "@/stores/auth-store";
import { useUI } from "@/stores/ui-store";
import { useTheme } from "@/context/theme-provider";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "@/lib/utils";

interface LinkItem {
  title: string;
  href: string;
  external?: boolean;
}

export function PublicHeader({ needsSetup }: { needsSetup?: boolean }) {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const setConfigOpen = useUI((s) => s.setConfigOpen);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks: LinkItem[] = [
    { title: t("home.navFeatures"), href: "#features" },
    { title: t("home.navHow"), href: "#how" },
    { title: t("home.navApi"), href: "#api" },
  ];

  const primaryTo = needsSetup ? "/setup" : user ? "/dashboard" : "/login";
  const primaryLabel = needsSetup ? t("home.initSystem") : user ? t("home.gotoConsole") : t("action.login");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            "pointer-events-auto mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            scrolled ? "max-w-[52rem] px-3 pt-3" : "max-w-7xl px-4 pt-0 md:px-6",
          )}
        >
          <nav
            className={cn(
              "flex items-center justify-between transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
              scrolled
                ? "h-12 rounded-2xl bg-background/60 pl-4 pr-1.5 shadow-[0_2px_16px_-6px_rgba(0,0,0,0.08),0_0_0_0.5px_rgba(0,0,0,0.02)] ring-[0.5px] ring-border/50 backdrop-blur-2xl dark:shadow-[0_2px_16px_-6px_rgba(0,0,0,0.4)]"
                : "h-16 px-2",
            )}
          >
            {/* Logo */}
            <Link to="/" className="group flex shrink-0 items-center gap-2.5">
              <div className="flex size-7 shrink-0 items-center justify-center transition-all duration-300 group-hover:scale-105">
                <div className="grid size-full place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Boxes className="size-4" />
                </div>
              </div>
              <span className="text-sm font-semibold tracking-tight">微软账号管理器</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden items-center gap-0.5 sm:flex">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  {link.title}
                </a>
              ))}

              <div className="mx-2 h-4 w-px bg-border/40" />

              <LanguageSwitcher />

              {/* theme preset config */}
              <button
                onClick={() => setConfigOpen(true)}
                className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title={t("Theme Settings")}
              >
                <Palette className="size-4" />
              </button>

              {/* theme switch */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title={t("theme.toggle")}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>

              <div className="mx-1 h-4 w-px bg-border/40" />

              <Button
                size="sm"
                className="h-8 rounded-lg px-3.5 text-xs font-medium"
                onClick={() => navigate(primaryTo)}
              >
                {primaryLabel}
              </Button>
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-2 sm:hidden">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="菜单"
              >
                <div className="relative size-4">
                  <span className={cn("absolute inset-x-0 block h-[1.5px] origin-center rounded-full bg-current transition-all duration-300", mobileOpen ? "top-[7px] rotate-45" : "top-[3px]")} />
                  <span className={cn("absolute inset-x-0 top-[7px] block h-[1.5px] rounded-full bg-current transition-all duration-300", mobileOpen ? "scale-x-0 opacity-0" : "opacity-100")} />
                  <span className={cn("absolute inset-x-0 block h-[1.5px] origin-center rounded-full bg-current transition-all duration-300", mobileOpen ? "top-[7px] -rotate-45" : "top-[11px]")} />
                </div>
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile full-screen overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/98 backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <div className="flex h-full flex-col justify-between px-8 pt-20 pb-10">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 py-3 text-base font-medium tracking-tight transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  mobileOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                  "text-muted-foreground",
                )}
                style={{ transitionDelay: mobileOpen ? `${100 + i * 50}ms` : "0ms" }}
              >
                {link.title}
              </a>
            ))}
          </nav>
          <div
            className={cn(
              "flex flex-col gap-3 transition-all duration-500",
              mobileOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
            style={{ transitionDelay: mobileOpen ? "250ms" : "0ms" }}
          >
            <button
              onClick={() => {
                setMobileOpen(false);
                navigate(primaryTo);
              }}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {primaryLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
