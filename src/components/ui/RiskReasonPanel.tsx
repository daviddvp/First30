import { Card } from "./Card";
import { Badge } from "./Badge";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { riskTone } from "@/lib/formatters";

/** Forma mínima que el panel necesita pintar (compatible con RiskResult y con
    el DTO del endpoint de detalle). */
export interface RiskReasonItem {
  reason: string;
  riskLevel: "high" | "medium" | "low";
  suggestedAction: string;
}

/** Lista los motivos de riesgo detectados por el motor, con su acción sugerida. */
export function RiskReasonPanel({ findings }: { findings: RiskReasonItem[] }) {
  if (findings.length === 0) {
    return (
      <Card className="flex items-center gap-2.5 p-4">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
          <ShieldCheck size={17} />
        </span>
        <p className="text-[13.5px] text-muted">Sin señales de riesgo activas. El onboarding avanza con normalidad.</p>
      </Card>
    );
  }
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={16} className="text-danger" />
        <h3 className="text-[14px] font-bold">Motivos de riesgo detectados</h3>
      </div>
      <ul className="space-y-2.5">
        {findings.map((f, idx) => (
          <li key={idx} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13.5px] font-semibold">{f.reason}</span>
              <Badge tone={riskTone(f.riskLevel)}>{f.riskLevel === "high" ? "Alto" : f.riskLevel === "medium" ? "Medio" : "Bajo"}</Badge>
            </div>
            <p className="mt-1 text-[12.5px] text-muted">
              <span className="font-semibold text-ink">Acción: </span>{f.suggestedAction}
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
