"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import type { ColumnMapping, InternalField } from "@/lib/csv/member-import-types";
import { INTERNAL_FIELDS } from "@/lib/csv/member-import-types";

const FIELD_LABELS: Record<InternalField, string> = {
  fullName: "Nombre completo *",
  email: "Email",
  phone: "Teléfono",
  joinDate: "Fecha de alta *",
  mainGoal: "Objetivo principal",
  level: "Nivel (beginner/intermediate/advanced)",
  assignedCoachName: "Nombre del coach",
  lastAttendanceAt: "Última asistencia",
  attendanceCount: "Nº de asistencias",
  nextClassAt: "Próxima clase",
  limitations: "Limitaciones / lesiones",
  acquisitionSource: "Fuente de captación",
  notes: "Notas",
};

const REQUIRED_FIELDS: InternalField[] = ["fullName", "joinDate"];

interface Props {
  mappings: ColumnMapping[];
  fileName: string;
  onConfirm: (mappings: ColumnMapping[]) => void;
  loading?: boolean;
}

export function ColumnMappingStep({ mappings: initial, fileName, onConfirm, loading }: Props) {
  const [mappings, setMappings] = useState<ColumnMapping[]>(initial);

  function updateMapping(csvHeader: string, internalField: InternalField | null) {
    setMappings((prev) =>
      prev.map((m) => (m.csvHeader === csvHeader ? { ...m, internalField } : m))
    );
  }

  const mapped = mappings.filter((m) => m.internalField !== null);
  const unmapped = mappings.filter((m) => m.internalField === null);
  const missingRequired = REQUIRED_FIELDS.filter(
    (f) => !mappings.some((m) => m.internalField === f)
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[14px] font-bold">Columnas detectadas — {fileName}</h3>
          <div className="flex gap-2">
            <Badge tone="success">{mapped.length} mapeadas</Badge>
            {unmapped.length > 0 && <Badge tone="warning">{unmapped.length} sin mapear</Badge>}
          </div>
        </div>

        <div className="space-y-2">
          {mappings.map((m) => (
            <div key={m.csvHeader} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
              <div className="w-40 shrink-0">
                <span className="rounded bg-subtle-2 px-1.5 py-0.5 font-mono text-[11.5px] text-ink">{m.csvHeader}</span>
              </div>
              <ChevronRight size={13} className="shrink-0 text-faint" />
              <select
                value={m.internalField ?? ""}
                onChange={(e) => updateMapping(m.csvHeader, (e.target.value as InternalField) || null)}
                className="flex-1 rounded border border-border bg-surface px-2 py-1 text-[12.5px] text-ink focus:border-accent focus:outline-none"
              >
                <option value="">— Ignorar esta columna —</option>
                {INTERNAL_FIELDS.map((f) => (
                  <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                ))}
              </select>
              {m.internalField ? (
                <CheckCircle2 size={15} className="shrink-0 text-accent-strong" />
              ) : (
                <XCircle size={15} className="shrink-0 text-faint" />
              )}
            </div>
          ))}
        </div>
      </Card>

      {missingRequired.length > 0 && (
        <div className="rounded-lg border border-danger-soft bg-danger-soft px-3 py-2.5 text-[12.5px] text-danger-strong">
          Faltan columnas obligatorias: <strong>{missingRequired.map((f) => FIELD_LABELS[f]).join(", ")}</strong>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          variant="primary"
          onClick={() => onConfirm(mappings)}
          disabled={missingRequired.length > 0 || loading}
        >
          {loading ? "Analizando…" : "Analizar datos →"}
        </Button>
      </div>
    </div>
  );
}
