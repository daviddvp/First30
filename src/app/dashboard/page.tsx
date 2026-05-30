import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChevronRight, Plus } from "lucide-react";

/* Placeholder visual de calidad. Los números son ilustrativos:
   en fases posteriores se sustituyen por datos reales del motor de reglas. */
const METRICS = [
  { label: "Nuevos socios este mes", value: "9", sub: "+3 vs. mes anterior" },
  { label: "Second Visit Rate", value: "56%", sub: "objetivo 65%", accent: true },
  { label: "Activation Rate", value: "62%", sub: "objetivo 70%", accent: true },
  { label: "Socios en riesgo", value: "3", sub: "2 de alta prioridad" },
];
const ACTIONS = [
  { txt: "Contactar a Marta — no volvió tras la primera clase", tone: "danger" as const, tag: "Alta" },
  { txt: "Asignar coach a David", tone: "danger" as const, tag: "Alta" },
  { txt: "Revisar onboarding de Laura — 10 días sin 2ª visita", tone: "warning" as const, tag: "Media" },
  { txt: "Enviar resumen de día 30 a Carlos", tone: "warning" as const, tag: "Media" },
];
const WEEKS = [{ l: "S1", v: 48 }, { l: "S2", v: 61 }, { l: "S3", v: 55 }, { l: "S4", v: 62 }];

export default function DashboardPage() {
  const max = Math.max(...WEEKS.map((w) => w.v));
  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Resumen"
        title="Dashboard"
        description="Activación temprana de nuevos socios · semana del 26 may – 1 jun."
        action={<Button icon={Plus}>Añadir socio</Button>}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {METRICS.map((m) => (
          <Card key={m.label} lift className="p-4">
            <div className="text-[12.5px] font-medium text-muted">{m.label}</div>
            <div className="mt-1.5 flex items-end gap-2">
              <span className={`tnum text-[26px] font-extrabold leading-none ${m.accent ? "text-accent-strong" : "text-ink"}`}>{m.value}</span>
              <span className="mb-0.5 text-[12px] font-medium text-faint">{m.sub}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-3 text-[15px] font-bold">Acciones recomendadas esta semana</h2>
          <div className="space-y-2">
            {ACTIONS.map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                <span className="truncate text-[13.5px] font-medium">{a.txt}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone={a.tone}>{a.tag}</Badge>
                  <ChevronRight size={15} className="text-faint" />
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-[15px] font-bold">Activación por semana</h2>
          <p className="mb-4 text-[12px] text-muted">% de socios activados al cierre de semana</p>
          <div className="flex h-36 items-end justify-between gap-3 px-1">
            {WEEKS.map((w) => (
              <div key={w.l} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-full w-full items-end justify-center">
                  <div className="w-full rounded-t-md bg-gradient-to-b from-[#2a9466] to-accent transition-all" style={{ height: `${(w.v / max) * 100}%` }} />
                </div>
                <span className="tnum text-[12px] font-bold">{w.v}%</span>
                <span className="text-[11px] text-faint">{w.l}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
