"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { membersApi } from "@/lib/api/members";
import { coachesApi } from "@/lib/api/coaches";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/ToastProvider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { SearchInput } from "@/components/ui/SearchInput";
import { Button } from "@/components/ui/Button";
import { Upload, UserPlus } from "lucide-react";
import { statusLabel, statusTone, levelLabel, formatRelative, initials } from "@/lib/formatters";
import type { Member } from "@/types";

const STATUS_OPTS = [
  { value: "", label: "Todos" }, { value: "in_progress", label: "En progreso" },
  { value: "at_risk", label: "En riesgo" }, { value: "activated", label: "Activado" },
  { value: "no_coach", label: "Sin coach" }, { value: "completed", label: "Completado" },
];
const RISK_OPTS = [
  { value: "", label: "Todos" }, { value: "high", label: "Alto" },
  { value: "medium", label: "Medio" }, { value: "low", label: "Bajo" },
];
const DAY_OPTS = [
  { value: "", label: "Cualquiera" }, { value: "0-3", label: "Día 0–3" },
  { value: "4-7", label: "Día 4–7" }, { value: "8-14", label: "Día 8–14" }, { value: "15-30", label: "Día 15–30" },
];

export function MembersView() {
  const toast = useToast();
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [coach, setCoach] = useState("");
  const [day, setDay] = useState("");
  const [search, setSearch] = useState("");

  const coaches = useAsync(() => coachesApi.list(), []);
  const [min, max] = useMemo(() => {
    if (!day) return [undefined, undefined] as const;
    const [a, b] = day.split("-").map(Number);
    return [a, b] as const;
  }, [day]);

  const members = useAsync(
    () => membersApi.list({ status, riskLevel: risk, coachId: coach, search, onboardingMin: min, onboardingMax: max }),
    [status, risk, coach, search, min, max],
  );

  async function assign(m: Member) {
    const target = coaches.data?.[0];
    if (!target) return;
    try {
      const updated = await membersApi.assignCoach(m.id, target.id);
      members.setData((prev) => prev?.map((x) => (x.id === m.id ? updated : x)) ?? null);
      toast.show(`Coach asignado a ${m.fullName.split(" ")[0]}`);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "No se pudo asignar el coach", "error");
    }
  }

  const coachOpts = [{ value: "", label: "Todos" }, ...(coaches.data ?? []).map((c) => ({ value: c.id, label: c.userName ?? c.id }))];
  const hasFilters = !!(status || risk || coach || day || search);

  return (
    <div>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre u objetivo…" />
          <span className="text-[12.5px] text-faint">{members.data?.length ?? 0} socios</span>
        </div>
        <div className="flex flex-col gap-2">
          <FilterChips label="Estado" options={STATUS_OPTS} value={status} onChange={setStatus} />
          <FilterChips label="Riesgo" options={RISK_OPTS} value={risk} onChange={setRisk} />
          <FilterChips label="Día" options={DAY_OPTS} value={day} onChange={setDay} />
          {coachOpts.length > 1 && <FilterChips label="Coach" options={coachOpts} value={coach} onChange={setCoach} />}
        </div>
      </div>

      {members.loading ? (
        <LoadingState rows={6} />
      ) : members.error ? (
        <ErrorState
          description="No hemos podido cargar los socios. Reintenta o revisa la conexión."
          action={<Button variant="ghost" onClick={members.reload}>Reintentar</Button>}
        />
      ) : !members.data || members.data.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={UserPlus}
            title="Sin socios con estos filtros"
            description="Prueba a relajar los filtros o limpiar la búsqueda."
          />
        ) : (
          <EmptyState
            icon={UserPlus}
            title="Aún no hay socios importados"
            description="Sube un CSV con los datos de tus socios actuales para empezar a detectar riesgos de onboarding."
            action={
              <Link href="/import/members">
                <Button icon={Upload}>Importar socios desde CSV</Button>
              </Link>
            }
          />
        )
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-subtle text-left text-faint">
                  {["Socio", "Día", "Coach", "Objetivo", "Nivel", "Últ. asistencia", "Estado", ""].map((h) => (
                    <th key={h} className="whitespace-nowrap px-4 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.data.map((m) => (
                  <tr key={m.id} className="border-t border-border transition hover:bg-subtle">
                    <td className="px-4 py-3">
                      <Link href={`/members/${m.id}`} className="flex items-center gap-2.5">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-avatar-bg text-[11px] font-semibold text-avatar-fg">{initials(m.fullName)}</span>
                        <span className="font-semibold">{m.fullName}</span>
                      </Link>
                    </td>
                    <td className="tnum px-4 py-3 font-semibold">D{m.onboardingDay}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{m.assignedCoachId ? "Asignado" : <span className="text-warn-strong">Sin coach</span>}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{m.mainGoal}</td>
                    <td className="px-4 py-3 text-muted">{levelLabel(m.level)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatRelative(m.lastAttendanceAt)}</td>
                    <td className="px-4 py-3"><Badge tone={statusTone(m.status)}>{statusLabel(m.status)}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      {m.assignedCoachId === null && (
                        <button onClick={() => assign(m)} className="text-[12.5px] font-semibold text-accent-strong hover:underline">Asignar coach</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
