"use client";

import { cn } from "@/lib/utils";

export interface ChipOption { value: string; label: string; }

/** Grupo de chips de filtro (single-select). Controlado por el padre. */
export function FilterChips({
  label, options, value, onChange,
}: {
  label: string;
  options: ChipOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[12px] font-semibold text-faint">{label}</span>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[12.5px] font-semibold transition",
              active ? "bg-ink text-canvas" : "border border-border-strong bg-surface text-muted hover:bg-subtle",
            )}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
