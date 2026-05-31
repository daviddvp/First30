import { Card } from "./Card";

export interface ScorePoint { day: number; score: number; }

/** Mini-gráfico de líneas SVG de la evolución del Activation Score. */
export function ScoreTrend({ points }: { points: ScorePoint[] }) {
  if (points.length < 2) return null;
  const W = 240, H = 64, P = 6;
  const xs = (i: number) => P + (i * (W - 2 * P)) / (points.length - 1);
  const ys = (s: number) => H - P - (s / 100) * (H - 2 * P);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xs(i).toFixed(1)} ${ys(p.score).toFixed(1)}`).join(" ");
  const area = `${path} L ${xs(points.length - 1)} ${H - P} L ${xs(0)} ${H - P} Z`;
  return (
    <Card className="p-4">
      <h3 className="text-[14px] font-bold">Evolución del Activation Score</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" preserveAspectRatio="none">
        <path d={area} fill="var(--accent-soft)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => <circle key={p.day} cx={xs(i)} cy={ys(p.score)} r={2.4} fill="var(--accent-strong)" />)}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-faint">
        {points.map((p) => <span key={p.day}>D{p.day}</span>)}
      </div>
    </Card>
  );
}
