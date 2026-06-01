"use client";

import { useState } from "react";
import { Card } from "./Card";
import { cn } from "@/lib/utils";
import type { ActivationScoreResult } from "@/lib/activation-score";
import { ChevronDown } from "lucide-react";

const LEVEL_CONFIG = {
  low:    { label: "Activación alta",  bar: "var(--accent)",  bg: "bg-[color:var(--accent-soft)]",  text: "text-accent-strong" },
  medium: { label: "Activación media", bar: "var(--warn)",    bg: "bg-[color:var(--warn-soft,#fef3c7)]", text: "text-warn-strong" },
  high:   { label: "Activación baja",  bar: "var(--danger)",  bg: "bg-[color:var(--danger-soft,#fee2e2)]", text: "text-danger-strong" },
} as const;

/** Muestra el nivel de activación del socio con wording operativo.
    El desglose técnico queda colapsado para no distraer en la demo. */
export function ActivationScoreCard({ result }: { result: ActivationScoreResult }) {
  const [open, setOpen] = useState(false);
  const cfg = LEVEL_CONFIG[result.classification];
  const pct = result.score;

  return (
    <Card className="p-4">
      <div className="mb-3 text-[12.5px] font-medium text-muted">Nivel de activación</div>
      <div className={cn("rounded-lg px-3 py-2.5", cfg.bg)}>
        <span className={cn("text-[14px] font-bold", cfg.text)}>{cfg.label}</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-subtle-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.bar }} />
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-3 flex w-full items-center gap-1 text-[11.5px] text-faint hover:text-ink"
      >
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
        {open ? "Ocultar detalle" : "Ver detalle"}
      </button>

      {open && (
        <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
          {result.breakdown.filter((b) => b.applied).map((b) => (
            <li key={b.label} className="flex items-center justify-between text-[12px]">
              <span className={cn(b.points < 0 ? "text-danger-strong" : "text-muted")}>{b.label}</span>
              <span className={cn("tnum font-semibold", b.points < 0 ? "text-danger-strong" : "text-accent-strong")}>
                {b.points > 0 ? `+${b.points}` : b.points}
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between border-t border-border pt-1.5 text-[12.5px]">
            <span className="font-semibold text-ink">Puntuación total</span>
            <span className="tnum font-bold text-ink">{result.score}/100</span>
          </li>
        </ul>
      )}
    </Card>
  );
}
