import { PageHeader } from "@/components/ui/PageHeader";
import { WeeklyReport } from "@/components/reports/WeeklyReport";

export const dynamic = "force-dynamic";

export default function WeeklyReportPage() {
  return (
    <div className="fade-in">
      <PageHeader eyebrow="Dirección" title="Informe semanal de onboarding"
        description="Reporte ejecutivo de la semana: métricas con comparación, distribución por coach, riesgos y resúmenes listos para enviar." />
      <WeeklyReport />
    </div>
  );
}
