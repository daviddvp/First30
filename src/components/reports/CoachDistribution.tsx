import { Card } from "@/components/ui/Card";
import { pct } from "@/lib/formatters";

export interface CoachRow { coachId: string; coachName: string; members: number; atRisk: number; load: number; }

/** Distribución de socios y carga por coach. */
export function CoachDistribution({ rows }: { rows: CoachRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.members));
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-[14px] font-bold">Distribución por coach</h3>
      <ul className="space-y-3">
        {rows.map((r) => {
          const loadColor = r.load > 0.8 ? "var(--danger)" : r.load > 0.6 ? "var(--warn)" : "var(--accent)";
          return (
            <li key={r.coachId}>
              <div className="mb-1 flex items-center justify-between text-[12.5px]">
                <span className="font-semibold">{r.coachName}</span>
                <span className="text-muted">{r.members} socios{r.atRisk > 0 && <span className="text-danger-strong"> · {r.atRisk} en riesgo</span>}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-subtle-2">
                  <div className="h-full rounded-full" style={{ width: `${(r.members / max) * 100}%`, background: "linear-gradient(90deg,var(--accent),var(--accent-strong))" }} />
                </div>
                <span className="tnum text-[11.5px] font-semibold" style={{ color: loadColor }}>carga {pct(r.load)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
