import Link from "next/link";
import { insightService } from "@/server/services/insight.service";
import { memberRepository } from "@/server/repositories/member.repository";
import { reportService } from "@/server/services/report.service";
import { resolveDefaultOrg } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ChevronRight, Plus } from "lucide-react";
import { pct, riskTone, riskLabel, initials } from "@/lib/formatters";
import type { Member } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const orgId = resolveDefaultOrg();

  // Cargar datos con graceful fallback si la DB no está configurada
  let members: Member[] = [];
  let report = null;
  let riskInsights: Awaited<ReturnType<typeof insightService.riskForOrg>> = [];

  try {
    [members, report, riskInsights] = await Promise.all([
      memberRepository.list(orgId),
      reportService.latestRaw(orgId),
      insightService.riskForOrg(orgId).then((r) => r.slice(0, 5)),
    ]);
  } catch {
    // DB no configurada o no disponible — mostrar estado vacío
  }

  const m = report?.metricsJson;
  const memberMap = new Map(members.map((mem) => [mem.id, mem]));

  const metrics = [
    { label: "Nuevos socios este mes", value: String(members.length), sub: "en onboarding" },
    { label: "Second Visit Rate", value: m ? pct(m.secondVisitRate) : "—", sub: "objetivo 65%", accent: true },
    { label: "Activation Rate", value: m ? pct(m.activationRate) : "—", sub: "objetivo 70%", accent: true },
    { label: "Socios en riesgo", value: String(riskInsights.length), sub: "detectados por el motor" },
  ];

  return (
    <div className="fade-in">
      <PageHeader eyebrow="Resumen" title="Dashboard"
        description="Activación temprana de nuevos socios. Las acciones recomendadas las prioriza el motor de riesgo."
        action={<Button icon={Plus}>Añadir socio</Button>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((x) => (
          <Card key={x.label} lift className="p-4">
            <div className="text-[12.5px] font-medium text-muted">{x.label}</div>
            <div className="mt-1.5 flex items-end gap-2">
              <span className={`tnum text-[26px] font-extrabold leading-none ${x.accent ? "text-accent-strong" : "text-ink"}`}>{x.value}</span>
              <span className="mb-0.5 text-[12px] font-medium text-faint">{x.sub}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-4">
        <h2 className="mb-3 text-[15px] font-bold">Acciones recomendadas esta semana</h2>
        <div className="space-y-2">
          {riskInsights.map((i) => {
            const mem = memberMap.get(i.risk.memberId);
            if (!mem) return null;
            return (
              <Link key={mem.id} href={`/members/${mem.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition hover:border-border-strong">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-avatar-bg text-[11px] font-semibold text-avatar-fg">{initials(mem.fullName)}</span>
                  <span className="truncate text-[13.5px] font-medium">{i.nextAction.title}</span>
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone={riskTone(i.risk.topRisk)}>{riskLabel(i.risk.topRisk)}</Badge>
                  <ChevronRight size={15} className="text-faint" />
                </span>
              </Link>
            );
          })}
          {riskInsights.length === 0 && (
            <p className="text-[13px] text-faint">No hay socios en riesgo detectados.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
