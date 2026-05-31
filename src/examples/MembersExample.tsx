/* EJEMPLO DE USO — cómo una pantalla consume la API (no es la página activa).
   Muestra el patrón: la UI nunca toca el seed; solo llama a membersApi. */
"use client";

import { useEffect, useState } from "react";
import { membersApi } from "@/lib/api/members";
import { ApiClientError } from "@/lib/api/client";
import type { Member } from "@/types";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { statusLabel, statusTone } from "@/lib/formatters";

export function MembersExample() {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>("");

  useEffect(() => {
    setMembers(null);
    setError(null);
    membersApi
      .list(riskFilter ? { riskLevel: riskFilter } : {})
      .then(setMembers)
      .catch((e: ApiClientError) => setError(e.message));
  }, [riskFilter]);

  // Acción: asignar coach y refrescar la fila en memoria.
  async function handleAssign(id: string) {
    try {
      const updated = await membersApi.assignCoach(id, "cph_a2");
      setMembers((prev) => prev?.map((m) => (m.id === id ? updated : m)) ?? null);
    } catch (e) {
      if (e instanceof ApiClientError) setError(e.message);
    }
  }

  if (error) return <ErrorState description={error} />;
  if (!members) return <LoadingState rows={5} />;
  if (members.length === 0) return <EmptyState title="Sin socios" description="No hay socios con este filtro." />;

  return (
    <div>
      <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="mb-3 rounded-lg border border-border-strong px-2 py-1 text-[13px]">
        <option value="">Todos los riesgos</option>
        <option value="high">Riesgo alto</option>
        <option value="medium">Riesgo medio</option>
        <option value="low">Riesgo bajo</option>
      </select>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2">
            <span className="text-[14px] font-semibold">{m.fullName}</span>
            <span className="flex items-center gap-2">
              <Badge tone={statusTone(m.status)}>{statusLabel(m.status)}</Badge>
              {m.assignedCoachId === null && (
                <button onClick={() => handleAssign(m.id)} className="text-[12.5px] font-semibold text-accent-strong">
                  Asignar coach
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
