"use client";

import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api/client";
import { useToast } from "@/components/ui/ToastProvider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ReportMetricCard, type MetricDelta } from "./ReportMetricCard";
import { CoachDistribution, type CoachRow } from "./CoachDistribution";
import { ReportSummaryBlock } from "./ReportSummaryBlock";
import { AuditLog } from "@/components/audit/AuditLog";
import { FileText, Download, Send, RefreshCw } from "lucide-react";
import { pct, riskTone, riskLabel } from "@/lib/formatters";

interface AdvancedReportDto {
  metrics: { newMembers: number; secondVisitRate: number; activationRate: number; atRisk: number; tasksCompleted: number; avgAttendanceFirst14: number; day30Completed: number; noCoach: number };
  comparison: { secondVisitRate: MetricDelta; activationRate: MetricDelta; newMembers: MetricDelta; atRisk: MetricDelta };
  openAlerts: { id: string; reason: string; riskLevel: "high" | "medium" | "low" }[];
  resolvedAlerts: { id: string; reason: string }[];
  coachDistribution: CoachRow[];
  membersWithoutSecondVisit: { id: string; fullName: string }[];
  membersWithoutCoach: { id: string; fullName: string }[];
  membersReachingDay30: { id: string; fullName: string }[];
  tasksCompleted: number;
  tasksPending: number;
  recommendations: { priority: "high" | "medium" | "low"; text: string }[];
  executiveSummary: string;
  coachSummary: string;
}

export function WeeklyReport() {
  const toast = useToast();
  const report = useAsync(() => api.get<AdvancedReportDto>("/reports/weekly/advanced"), []);

  async function generate() {
    try {
      await api.post("/reports/weekly/generate");
      toast.show("Informe generado");
      report.reload();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "No se pudo generar", "error");
    }
  }
  const downloadPdf = () => toast.show("Descarga de PDF iniciada (simulado)", "info");
  const sendEmail = () => toast.show("Informe enviado por email (simulado)", "info");

  if (report.loading) return <LoadingState rows={6} />;
  if (report.error || !report.data) return <ErrorState description={report.error ?? "Sin datos"} action={<Button variant="ghost" onClick={report.reload}>Reintentar</Button>} />;

  const r = report.data;
  const m = r.metrics;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" icon={RefreshCw} onClick={generate}>Generar informe</Button>
        <Button variant="ghost" icon={Download} onClick={downloadPdf}>Descargar PDF</Button>
        <Button variant="ghost" icon={Send} onClick={sendEmail}>Enviar por email</Button>
      </div>

      {/* Métricas con comparación */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ReportMetricCard label="Nuevos socios" display={String(m.newMembers)} comparison={r.comparison.newMembers} />
        <ReportMetricCard label="Second Visit Rate" display={pct(m.secondVisitRate)} comparison={r.comparison.secondVisitRate} />
        <ReportMetricCard label="Activation Rate" display={pct(m.activationRate)} comparison={r.comparison.activationRate} />
        <ReportMetricCard label="Socios en riesgo" display={String(m.atRisk)} comparison={r.comparison.atRisk} goodWhenUp={false} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <ReportSummaryBlock title="Resumen para dirección" badge="Dirección" text={r.executiveSummary} />
          <ReportSummaryBlock title="Resumen para coaches" badge="Coaches" text={r.coachSummary} />

          {/* Recomendaciones por prioridad */}
          <Card className="p-4">
            <h3 className="mb-3 text-[14px] font-bold">Recomendaciones por prioridad</h3>
            <ul className="space-y-2">
              {r.recommendations.map((rec, i) => (
                <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
                  <span className="text-[13px] font-medium">{rec.text}</span>
                  <Badge tone={riskTone(rec.priority)}>{riskLabel(rec.priority)}</Badge>
                </li>
              ))}
              {r.recommendations.length === 0 && <li className="py-2 text-center text-[12.5px] text-faint">Sin recomendaciones críticas.</li>}
            </ul>
          </Card>

          {/* Riesgos abiertos / resueltos */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-2 text-[14px] font-bold">Riesgos abiertos <span className="text-faint">({r.openAlerts.length})</span></h3>
              <ul className="space-y-1.5">
                {r.openAlerts.slice(0, 6).map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-[12.5px]">
                    <span className="truncate text-muted">{a.reason}</span>
                    <Badge tone={riskTone(a.riskLevel)}>{riskLabel(a.riskLevel)}</Badge>
                  </li>
                ))}
                {r.openAlerts.length === 0 && <li className="text-[12.5px] text-faint">Ninguno</li>}
              </ul>
            </Card>
            <Card className="p-4">
              <h3 className="mb-2 text-[14px] font-bold">Riesgos resueltos <span className="text-faint">({r.resolvedAlerts.length})</span></h3>
              <ul className="space-y-1.5">
                {r.resolvedAlerts.slice(0, 6).map((a) => (
                  <li key={a.id} className="truncate text-[12.5px] text-muted">{a.reason}</li>
                ))}
                {r.resolvedAlerts.length === 0 && <li className="text-[12.5px] text-faint">Ninguno</li>}
              </ul>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <CoachDistribution rows={r.coachDistribution} />
          <Card className="p-4">
            <h3 className="mb-3 text-[14px] font-bold">Esta semana</h3>
            <dl className="space-y-2 text-[13px]">
              <Row label="Sin segunda visita" value={r.membersWithoutSecondVisit.length} />
              <Row label="Sin coach" value={r.membersWithoutCoach.length} danger={r.membersWithoutCoach.length > 0} />
              <Row label="Llegan a día 30" value={r.membersReachingDay30.length} />
              <Row label="Tareas completadas" value={r.tasksCompleted} />
              <Row label="Tareas pendientes" value={r.tasksPending} />
              <Row label="Asist. media 14 días" value={m.avgAttendanceFirst14} />
            </dl>
          </Card>
          <AuditLog />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className={`tnum font-bold ${danger ? "text-danger-strong" : "text-ink"}`}>{value}</dd>
    </div>
  );
}
