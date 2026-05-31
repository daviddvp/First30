import { PageHeader } from "@/components/ui/PageHeader";
import { orgScope } from "@/data/mock-db";
import { resolveDefaultOrg } from "@/lib/tenant";
import { RiskView } from "@/components/risk/RiskView";

export const dynamic = "force-dynamic";

export default function RiskPage() {
  const scope = orgScope(resolveDefaultOrg());
  const memberNames: Record<string, string> = {};
  scope.members().forEach((m) => { memberNames[m.id] = m.fullName; });

  // Motivos únicos de las alertas abiertas, para el filtro por motivo.
  const reasons = Array.from(new Set(scope.openAlerts().map((a) => a.reason)));
  const memberReasons = [{ value: "", label: "Todos" }, ...reasons.map((r) => ({ value: r, label: r.length > 28 ? r.slice(0, 28) + "…" : r }))];

  return (
    <div className="fade-in">
      <PageHeader eyebrow="Retención" title="Socios en riesgo"
        description="Radar de abandono temprano. Resuelve o pospón alertas; el cambio se refleja al instante." />
      <RiskView memberNames={memberNames} memberReasons={memberReasons} />
    </div>
  );
}
