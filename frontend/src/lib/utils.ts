import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(t?: string | null): string {
  if (!t) return "-";
  const d = new Date(t);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("zh-CN", { hour12: false });
}

export function maskValue(v?: string | null, visible = 2): string {
  if (!v) return "-";
  if (v.length <= visible) return "*".repeat(v.length);
  return "*".repeat(Math.max(4, v.length - visible)) + v.slice(-visible);
}

export function relativeSeconds(s: number): string {
  if (s < 60) return `${s} 秒`;
  if (s < 3600) return `${Math.floor(s / 60)} 分钟`;
  if (s < 86400) return `${Math.floor(s / 3600)} 小时`;
  return `${Math.floor(s / 86400)} 天`;
}
