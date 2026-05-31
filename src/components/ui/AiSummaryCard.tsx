import { Card } from "./Card";
import { Sparkles } from "lucide-react";

/** Resumen "generado por IA" (simulado en el service). Lectura. */
export function AiSummaryCard({ summary, recommendedClass }: { summary: string; recommendedClass: string }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-accent-soft text-accent-strong"><Sparkles size={15} /></span>
        <h3 className="text-[14px] font-bold">Resumen del socio</h3>
        <span className="rounded-full bg-subtle-2 px-2 py-0.5 text-[10.5px] font-semibold text-faint">IA</span>
      </div>
      <p className="text-[13px] leading-relaxed text-ink">{summary}</p>
      <div className="mt-3 rounded-lg bg-subtle px-3 py-2">
        <span className="text-[11.5px] font-semibold uppercase tracking-wide text-faint">Próxima clase recomendada</span>
        <p className="mt-0.5 text-[13px] font-semibold text-accent-strong">{recommendedClass}</p>
      </div>
    </Card>
  );
}
