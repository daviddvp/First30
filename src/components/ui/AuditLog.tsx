import { Card } from "./Card";
import { formatRelative } from "@/lib/formatters";

export interface AuditItem { id: string; action: string; createdAt: string; }
const LABEL: Record<string, string> = {
  created: "Creado", updated: "Actualizado", assigned_coach: "Coach asignado",
  resolved_alert: "Alerta resuelta", sent_message: "Mensaje enviado",
  completed_task: "Tarea completada", generated_report: "Informe generado", deleted: "Eliminado",
};

/** Registro de auditoría del socio (lectura). */
export function AuditLog({ items }: { items: AuditItem[] }) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-[14px] font-bold">Registro de cambios</h3>
      {items.length === 0 ? (
        <p className="py-3 text-center text-[12.5px] text-faint">Sin cambios registrados.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-[12.5px]">
              <span className="font-medium">{LABEL[a.action] ?? a.action}</span>
              <span className="text-faint">{formatRelative(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
