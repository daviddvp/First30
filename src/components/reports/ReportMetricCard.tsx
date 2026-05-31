import { Card } from "@/components/ui/Card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export interface MetricDelta {
  value: number; previous: number | null; delta: number | null;
  direction: "up" | "down" | "flat" | "na";
}

/** Tarjeta de métrica con comparación opcional vs semana anterior.
    `goodWhenUp` define si subir es positivo (verde) o negativo (rojo). */
export function ReportMetricCard({
  label, display, comparison, goodWhenUp = true,
}: {
  label: string;
  display: string;
  comparison?: MetricDelta;
  goodWhenUp?: boolean;
}) {
  const dir = comparison?.direction;
  const isGood = dir === "up" ? goodWhenUp : dir === "down" ? !goodWhenUp : true;
  const Icon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : Minus;
  const showDelta = comparison && dir !== "na";

  return (
    <Card className="p-4">
      <div className="text-[12.5px] font-medium text-muted">{label}</div>
      <div className="mt-1.5 flex items-end justify-between">
        <span className="tnum text-[24px] font-extrabold leading-none">{display}</span>
        {showDelta && (
          <span className={`inline-flex items-center gap-0.5 text-[12px] font-bold ${isGood ? "text-accent-strong" : "text-danger-strong"}`}>
            <Icon size={13} strokeWidth={2.5} />
            {Math.abs(Math.round((comparison!.delta ?? 0) * (Number.isInteger(comparison!.value) ? 1 : 100)))}
            {Number.isInteger(comparison!.value) ? "" : " pp"}
          </span>
        )}
      </div>
    </Card>
  );
}
