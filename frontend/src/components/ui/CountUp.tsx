import { useEffect, useMemo, useState } from "react";

interface Props {
  value: string;
  durationMs?: number;
  className?: string;
}

/**
 * Lightweight animator: counts numeric portions of `value` up from 0 to the
 * target on mount, preserving any leading sign and trailing suffix (e.g. `%`,
 * ` ML/day`, `+8.7%`, `420`). Non-numeric values are returned unchanged.
 *
 * NOTE: `target` must be memoized — without `useMemo`, parseTarget returns a
 * new object every render and triggers the animation effect on every parent
 * re-render, which is why the KPI numbers were flickering once per second
 * whenever react-query refetched in the background.
 */
export default function CountUp({ value, durationMs = 700, className }: Props) {
  const target = useMemo(() => parseTarget(value), [value]);
  const [display, setDisplay] = useState<string>(() => initial(value, target));

  useEffect(() => {
    if (!target) {
      setDisplay(value);
      return;
    }
    const parsed = target;
    let raf = 0;
    const start = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = easeOut(t);
      const current = parsed.value * eased;
      setDisplay(format(current, parsed));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, target, durationMs]);

  return <span className={className}>{display}</span>;
}

interface Parsed {
  prefix: string;
  suffix: string;
  value: number;
  decimals: number;
  hasComma: boolean;
}

function parseTarget(raw: string): Parsed | null {
  const m = raw.match(/^([^\d-]*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!m) return null;
  const [, prefix, numStr, suffix] = m;
  const cleaned = numStr.replace(/,/g, "");
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  const decimals = cleaned.includes(".") ? cleaned.split(".")[1].length : 0;
  return { prefix, suffix, value, decimals, hasComma: numStr.includes(",") };
}

function format(v: number, p: Parsed): string {
  const fixed = v.toFixed(p.decimals);
  let formatted = fixed;
  if (p.hasComma) {
    const [intPart, decPart] = fixed.split(".");
    formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (decPart ? `.${decPart}` : "");
  }
  return `${p.prefix}${formatted}${p.suffix}`;
}

function initial(raw: string, p: Parsed | null): string {
  if (!p) return raw;
  return `${p.prefix}${(0).toFixed(p.decimals)}${p.suffix}`;
}
