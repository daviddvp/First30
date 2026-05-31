"use client";

import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelative } from "@/lib/formatters";
import {
  UserPlus, AlertTriangle, MessageSquare, CheckSquare,
  ClipboardCheck, Dumbbell, FileText, ShieldCheck, History, type LucideIcon,
} from "lucide-react";

interface AuditEntry {
  id: string; actorName: string; action: string; entityType: string;
  entityId: string; metadataSummary: string | null; createdAt: string;
}

const ACTION_META: Record<string, { label: string; icon: LucideIcon }> = {
  assigned_coach: { label: "Coach asignado", icon: UserPlus },
  created: { label: "Creado", icon: AlertTriangle },
  sent_message: { label: "Mensaje", icon: MessageSquare },
  completed_task: { label: "Tarea completada", icon: CheckSquare },
  resolved_alert: { label: "Alerta resuelta", icon: ShieldCheck },
  generated_report: { label: "Informe generado", icon: FileText },
  updated: { label: "Actualizado", icon: History },
};
const ENTITY_LABEL: Record<string, string> = {
  Member: "socio", RiskAlert: "alerta", Task: "tarea", MessageLog: "mensaje",
  WeeklyReport: "informe", CheckIn: "check-in", Organization: "organización", OnboardingRule: "reglas",
};

/** Audit log de eventos recientes de la organización. */
export function AuditLog() {
  const audit = useAsync(() => api.get<AuditEntry[]>("/audit"), []);

  if (audit.loading) return <LoadingState rows={6} />;
  if (audit.error) return <ErrorState description={audit.error} />;
  if (!audit.data || audit.data.length === 0) return <EmptyState icon={History} title="Sin eventos" description="Aún no hay actividad registrada." />;

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-[14px] font-bold">Eventos recientes</h3>
      <ul className="space-y-1">
        {audit.data.map((e) => {
          const meta = ACTION_META[e.action] ?? { label: e.action, icon: History };
          const Icon = meta.icon;
          return (
            <li key={e.id} className="flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-subtle">
              <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-subtle-2 text-muted">
                <Icon size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px]">
                  <span className="font-semibold">{e.actorName}</span>
                  <span className="text-muted"> · {meta.label} en {ENTITY_LABEL[e.entityType] ?? e.entityType}</span>
                </div>
                {e.metadataSummary && <div className="text-[11.5px] text-faint">{e.metadataSummary}</div>}
              </div>
              <span className="shrink-0 text-[11.5px] text-faint">{formatRelative(e.createdAt)}</span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
