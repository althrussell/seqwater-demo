import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function fmtNumber(n: number | string | null | undefined, opts: Intl.NumberFormatOptions = {}): string {
  if (n === null || n === undefined || n === "") return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("en-AU", { maximumFractionDigits: 1, ...opts }).format(v);
}

export function fmtPercent(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${n.toFixed(1)}%`;
}

export function fmtAUD(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `A$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `A$${(n / 1_000).toFixed(0)}k`;
  return `A$${n.toFixed(0)}`;
}

export function fmtRel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (Math.abs(diff) < 60) return "just now";
  if (Math.abs(diff) < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (Math.abs(diff) < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86_400)}d ago`;
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
  });
}

export function statusFromBand(band: string): "ok" | "watch" | "elevated" | "critical" {
  switch (band) {
    case "Critical":
      return "critical";
    case "High":
      return "elevated";
    case "Medium":
      return "watch";
    default:
      return "ok";
  }
}

export type Posture = "normal" | "monitor" | "watch" | "escalate";

export function postureFromBand(band: string | undefined | null): Posture {
  if (!band) return "normal";
  switch (band.toLowerCase()) {
    case "critical":
    case "escalate":
      return "escalate";
    case "high":
    case "elevated":
    case "watch":
      return "watch";
    case "medium":
    case "monitor":
      return "monitor";
    default:
      return "normal";
  }
}

export function fmtAEST(d: Date): string {
  // formatted like "29 May 2026 09:15 AM AEST"
  const date = d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Brisbane",
  });
  const time = d
    .toLocaleTimeString("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Australia/Brisbane",
    })
    .toUpperCase()
    .replace(/\s+/g, " ");
  return `${date} ${time} AEST`;
}
