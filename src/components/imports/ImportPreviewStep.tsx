"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AlertCircle, AlertTriangle, CheckCircle2, RefreshCw, Users } from "lucide-react";
import type { ImportPreviewResponse, ValidatedImportRow } from "@/lib/csv/member-import-types";
import { cn } from "@/lib/utils";

interface Props {
  preview: ImportPreviewResponse;
  fileName: string;
  onConfirm: (rows: ValidatedImportRow[]) => void;
  onBack: () => void;
  loading?: boolean;
}

const ACTION_CONFIG = {
  create:             { label: "Crear",     tone: "success" as const,  icon: CheckCircle2 },
  update:             { label: "Actualizar", tone: "warning" as const,  icon: RefreshCw },
  duplicate_warning:  { label: "Posible duplicado", tone: "warning" as const, icon: AlertTriangle },
  error:              { label: "Error",     tone: "danger" as const,   icon: AlertCircle },
  skipped:            { label: "Ignorar",   tone: "neutral" as const,  icon: AlertCircle },
};

export function ImportPreviewStep({ preview, fileName, onConfirm, onBack, loading }: Props) {
  const [filter, setFilter] = useState<"all" | "errors" | "warnings" | "ok">("all");

  const { summary, rows } = preview;
  const confirmableRows = rows.filter((r) => r.action !== "error" && r.action !== "skipped");
  const hasErrors = summary.rowsWithErrors > 0;
  const hasDuplicates = summary.possibleDuplicatesCount > 0;

  const filtered = rows.filter((r) => {
    if (filter === "errors") return r.action === "error";
    if (filter === "warnings") return r.warnings.length > 0 && r.action !== "error";
    if (filter === "ok") return r.errors.length === 0 && r.warnings.length === 0;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="Total filas" value={summary.totalRows} />
        <SummaryCard label="Se crearán" value={summary.createCount} tone="success" />
        <SummaryCard label="Se actualizarán" value={summary.updateCount} tone="warn" />
        <SummaryCard label="Con errores" value={summary.rowsWithErrors} tone="danger" />
      </div>

      {/* Mensajes informativos */}
      {hasErrors && (
        <div className="flex items-center gap-2 rounded-lg border border-danger-soft bg-danger-soft px-3 py-2.5 text-[13px] text-danger-strong">
          <AlertCircle size={15} />
          Hemos detectado {summary.rowsWithErrors} {summary.rowsWithErrors === 1 ? "fila con error" : "filas con errores"}.
          Puedes corregirlas en el CSV y volver a subirlo, o continuar ignorando esas filas.
        </div>
      )}
      {hasDuplicates && (
        <div className="flex items-center gap-2 rounded-lg border border-warn-soft bg-warn-soft px-3 py-2.5 text-[13px] text-warn-strong">
          <AlertTriangle size={15} />
          {summary.possibleDuplicatesCount} {summary.possibleDuplicatesCount === 1 ? "socio aparece" : "socios aparecen"} como posibles duplicados. Revísalos antes de confirmar.
        </div>
      )}
      {summary.rowsWithWarnings > 0 && !hasErrors && (
        <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-[13px] text-muted">
          <AlertTriangle size={15} className="text-warn-strong" />
          {summary.rowsWithWarnings} {summary.rowsWithWarnings === 1 ? "fila tiene advertencias" : "filas tienen advertencias"} (sin email, sin teléfono, etc.). Puedes continuar igualmente.
        </div>
      )}

      {/* Tabla de filas */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-[13px] font-semibold">{fileName}</span>
          <div className="flex gap-1.5">
            {(["all", "errors", "warnings", "ok"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold transition",
                  filter === f ? "bg-accent text-white" : "bg-subtle-2 text-muted hover:bg-subtle",
                )}
              >
                {f === "all" ? "Todas" : f === "errors" ? "Errores" : f === "warnings" ? "Avisos" : "OK"}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-[12.5px]">
            <thead className="sticky top-0 bg-subtle">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-muted">Fila</th>
                <th className="px-3 py-2 text-left font-semibold text-muted">Nombre</th>
                <th className="px-3 py-2 text-left font-semibold text-muted">Email</th>
                <th className="px-3 py-2 text-left font-semibold text-muted">Acción</th>
                <th className="px-3 py-2 text-left font-semibold text-muted">Avisos / Errores</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const cfg = ACTION_CONFIG[row.action];
                return (
                  <tr key={row.rowIndex} className="border-t border-border hover:bg-subtle">
                    <td className="px-3 py-2 text-faint">{row.rowIndex}</td>
                    <td className="px-3 py-2 font-medium text-ink">{row.fullName || <span className="text-danger-strong">—</span>}</td>
                    <td className="px-3 py-2 text-muted">{row.email ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge tone={cfg.tone}>{cfg.label}</Badge>
                    </td>
                    <td className="max-w-[280px] px-3 py-2">
                      {row.errors.map((e, i) => (
                        <div key={i} className="text-danger-strong">{e}</div>
                      ))}
                      {row.warnings.slice(0, 2).map((w, i) => (
                        <div key={i} className="text-warn-strong">{w}</div>
                      ))}
                      {row.warnings.length > 2 && (
                        <div className="text-faint">+{row.warnings.length - 2} más</div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-faint">Sin filas en este filtro</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-[13px] text-muted hover:text-ink">← Volver</button>
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] text-muted">
            {summary.createCount + summary.updateCount} socios se importarán
          </span>
          <Button
            variant="primary"
            icon={Users}
            onClick={() => onConfirm(confirmableRows)}
            disabled={confirmableRows.length === 0 || loading}
          >
            {loading ? "Importando…" : `Confirmar importación`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: "success" | "warn" | "danger" }) {
  const colorMap = { success: "text-accent-strong", warn: "text-warn-strong", danger: "text-danger-strong" };
  return (
    <Card className="p-3 text-center">
      <div className={cn("tnum text-[22px] font-extrabold", tone ? colorMap[tone] : "text-ink")}>{value}</div>
      <div className="mt-0.5 text-[11.5px] text-muted">{label}</div>
    </Card>
  );
}
