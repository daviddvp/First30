import { PageHeader } from "@/components/ui/PageHeader";
import { RiskView } from "@/components/risk/RiskView";

export const dynamic = "force-dynamic";

export default function RiskPage() {
  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Retención"
        title="Socios en riesgo"
        description="Radar de abandono temprano. Resuelve o pospón alertas; el cambio se refleja al instante."
      />
      <RiskView />
    </div>
  );
}
