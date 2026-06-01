"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, AlertTriangle, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { ImportConfirmResponse } from "@/lib/csv/member-import-types";

interface Props {
  result: ImportConfirmResponse;
  onImportAnother: () => void;
}

export function ImportResultStep({ result, onImportAnother }: Props) {
  const total = result.created + result.updated;
  const hasAlerts = result.alertsCreated > 0;
  const hasTasks = result.tasksCreated > 0;
  const success = total > 0;

  return (
    <div className="space-y-4">
      {/* Estado principal */}
      <Card className="p-6 text-center">
        <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${success ? "bg-accent-soft" : "bg-subtle-2"}`}>
          {success ? (
            <CheckCircle2 size={28} className="text-accent-strong" />
          ) : (
            <AlertCircle size={28} className="text-muted" />
          )}
        </div>

        {success ? (
          <>
            <h2 className="text-[17px] font-bold text-ink">Importación completada</h2>
            <p className="mt-1 text-[13.5px] text-muted">
              Ya puedes revisar los nuevos socios y las acciones recomendadas por First30.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-[17px] font-bold text-ink">Sin cambios</h2>
            <p className="mt-1 text-[13.5px] text-muted">
              No se importó ningún socio (todas las filas tenían errores o eran duplicados).
            </p>
          </>
        )}
      </Card>

      {/* Desglose */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ResultCard label="Socios creados" value={result.created} tone="success" />
        <ResultCard label="Socios actualizados" value={result.updated} tone="accent" />
        <ResultCard label="Filas ignoradas" value={result.ignored} tone="neutral" />
        <ResultCard label="Alertas creadas" value={result.alertsCreated} tone={hasAlerts ? "warn" : "neutral"} />
      </div>

      {/* Info sobre alertas/tareas */}
      {(hasAlerts || hasTasks) && (
        <Card className="p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warn-strong" />
            <div className="text-[13px] text-muted">
              {hasAlerts && (
                <p>First30 ha detectado <strong className="text-ink">{result.alertsCreated} socios en riesgo</strong> según las reglas de onboarding del box.</p>
              )}
              {hasTasks && (
                <p className="mt-1">Se han creado <strong className="text-ink">{result.tasksCreated} tareas recomendadas</strong> para el equipo de coaches.</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* CTAs */}
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {success && (
          <>
            <Link href="/members">
              <Button variant="primary" icon={Users}>Ver nuevos socios</Button>
            </Link>
            {hasAlerts && (
              <Link href="/risk">
                <Button variant="soft" icon={AlertTriangle}>Ver socios en riesgo</Button>
              </Link>
            )}
          </>
        )}
        <Button variant="ghost" onClick={onImportAnother}>Importar otro CSV</Button>
      </div>
    </div>
  );
}

function ResultCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  const colors: Record<string, string> = {
    success: "text-accent-strong", warn: "text-warn-strong",
    danger: "text-danger-strong", accent: "text-accent", neutral: "text-muted",
  };
  return (
    <Card className="p-3 text-center">
      <div className={`tnum text-[22px] font-extrabold ${colors[tone] ?? "text-ink"}`}>{value}</div>
      <div className="mt-0.5 text-[11.5px] text-muted">{label}</div>
    </Card>
  );
}
