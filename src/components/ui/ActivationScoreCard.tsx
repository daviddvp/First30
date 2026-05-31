import { Card } from "./Card";
import { cn } from "@/lib/utils";
import type { ActivationScoreResult } from "@/lib/activation-score";
import { riskLabel, riskTone } from "@/lib/formatters";
import { Badge } from "./Badge";

const RING: Record<string, string> = { high: "var(--danger)", medium: "var(--warn)", low: "var(--accent)" };

/** Muestra el Activation Score con anillo y desglose de puntos. Recibe el
    resultado ya calculado por el motor (no calcula nada aquí). */
export function ActivationScoreCard({ result }: { result: ActivationScoreResult }) {
  const color = RING[result.classification];
  const deg = (result.score / 100) * 360;
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 shrink-0">
          <div className="h-full w-full rounded-full"
            style={{ background: `conic-gradient(${color} ${deg}deg, var(--subtle-2) ${deg}deg)` }} />
          <div className="absolute inset-[6px] flex flex-col items-center justify-center rounded-full bg-surface">
            <span className="tnum text-[20px] font-extrabold leading-none">{result.score}</span>
            <span className="text-[9px] font-semibold uppercase text-faint">score</span>
          </div>
        </div>
        <div>
          <div className="text-[12.5px] font-medium text-muted">Activation Score</div>
          <Badge tone={riskTone(result.classification)} className="mt-1">
            {result.classification === "low" ? "Activado / bajo riesgo" : `Riesgo ${riskLabel(result.classification).toLowerCase()}`}
          </Badge>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {result.breakdown.filter((b) => b.applied).map((b) => (
          <li key={b.label} className="flex items-center justify-between text-[12.5px]">
            <span className={cn(b.points < 0 ? "text-danger-strong" : "text-muted")}>{b.label}</span>
            <span className={cn("tnum font-semibold", b.points < 0 ? "text-danger-strong" : "text-accent-strong")}>
              {b.points > 0 ? `+${b.points}` : b.points}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
