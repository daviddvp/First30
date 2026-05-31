"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { alertsApi } from "@/lib/api/alerts";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/ToastProvider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, Check, Clock } from "lucide-react";
import { riskTone, riskLabel } from "@/lib/formatters";
import type { RiskAlert } from "@/types";

const SEVERITY_OPTS = [
  { value: "", label: "Todas" }, { value: "high", label: "Alto" },
  { value: "medium", label: "Medio" }, { value: "low", label: "Bajo" },
];

export function RiskView({ memberNames, memberReasons }: {
  memberNames: Record<string, string>;
  memberReasons: { value: string; label: string }[];
}) {
  const toast = useToast();
  const [severity, setSeverity] = useState("");
  const [reason, setReason] = useState("");

  const alerts = useAsync(() => alertsApi.list({ riskLevel: severity, status: "open" }), [severity]);

  const filtered = useMemo(() => {
    const list = alerts.data ?? [];
    return reason ? list.filter((a) => a.reason === reason) : list;
  }, [alerts.data, reason]);

  async function resolve(a: RiskAlert) {
    try {
      await alertsApi.resolve(a.id);
      alerts.setData((prev) => prev?.filter((x) => x.id !== a.id) ?? null);
      toast.show("Alerta resuelta");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "No se pudo resolver", "error");
    }
  }
  async function snooze(a: RiskAlert) {
    try {
      await alertsApi.snooze(a.id, 3);
      alerts.setData((prev) => prev?.filter((x) => x.id !== a.id) ?? null);
      toast.show("Alerta pospuesta 3 días", "info");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "No se pudo posponer", "error");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2">
        <FilterChips label="Severidad" options={SEVERITY_OPTS} value={severity} onChange={setSeverity} />
        {memberReasons.length > 1 && <FilterChips label="Motivo" options={memberReasons} value={reason} onChange={setReason} />}
      </div>

      {alerts.loading ? (
        <LoadingState rows={4} />
      ) : alerts.error ? (
        <ErrorState description={alerts.error} action={<Button variant="ghost" onClick={alerts.reload}>Reintentar</Button>} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Sin alertas abiertas" description="No hay socios en riesgo con estos filtros." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/members/${a.memberId}`} className="text-[14px] font-semibold hover:underline">
                  {memberNames[a.memberId] ?? "Socio"}
                </Link>
                <Badge tone={riskTone(a.riskLevel)}>{riskLabel(a.riskLevel)}</Badge>
              </div>
              <div className="mt-2 text-[13px] font-medium">{a.reason}</div>
              <div className="mt-2 rounded-lg bg-subtle px-3 py-2 text-[12.5px] text-muted">
                <span className="font-semibold text-ink">Acción: </span>{a.suggestedAction}
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="primary" icon={Check} onClick={() => resolve(a)}>Resolver</Button>
                <Button variant="ghost" icon={Clock} onClick={() => snooze(a)}>Posponer</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
