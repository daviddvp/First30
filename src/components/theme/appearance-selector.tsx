"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; icon: LucideIcon };
const OPTIONS: Option[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

/** Segmented control claro/oscuro/sistema. `compact` para el Topbar (solo iconos). */
export function AppearanceSelector({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // evita hydration mismatch

  const current = mounted ? theme ?? "system" : "system";

  return (
    <div
      role="radiogroup"
      aria-label="Apariencia"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-border-strong bg-canvas p-0.5",
      )}
    >
      {OPTIONS.map((o) => {
        const active = current === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => setTheme(o.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              active ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
            )}
          >
            <Icon size={15} strokeWidth={2.2} />
            {!compact && <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
