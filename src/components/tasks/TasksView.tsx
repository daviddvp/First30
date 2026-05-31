"use client";

import { useState } from "react";
import { tasksApi } from "@/lib/api/tasks";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/ToastProvider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilterChips } from "@/components/ui/FilterChips";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { priorityLabel, priorityTone } from "@/lib/formatters";
import type { Task, TaskStatus } from "@/types";

const PRIORITY_OPTS = [
  { value: "", label: "Todas" }, { value: "high", label: "Alta" },
  { value: "medium", label: "Media" }, { value: "low", label: "Baja" },
];
const GROUPS: { key: TaskStatus; label: string }[] = [
  { key: "today", label: "Hoy" }, { key: "this_week", label: "Esta semana" },
  { key: "pending", label: "Pendientes" }, { key: "completed", label: "Completadas" },
];

export function TasksView({ assignees }: { assignees: { value: string; label: string }[] }) {
  const toast = useToast();
  const [priority, setPriority] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const tasks = useAsync(() => tasksApi.list({ priority, assignedTo }), [priority, assignedTo]);

  async function toggle(t: Task) {
    const completed = t.status !== "completed";
    try {
      const updated = await tasksApi.complete(t.id, completed);
      tasks.setData((prev) => prev?.map((x) => (x.id === t.id ? updated : x)) ?? null);
      toast.show(completed ? "Tarea completada" : "Tarea reabierta");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "No se pudo actualizar la tarea", "error");
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2">
        <FilterChips label="Prioridad" options={PRIORITY_OPTS} value={priority} onChange={setPriority} />
        {assignees.length > 1 && <FilterChips label="Responsable" options={assignees} value={assignedTo} onChange={setAssignedTo} />}
      </div>

      {tasks.loading ? (
        <LoadingState rows={6} />
      ) : tasks.error ? (
        <ErrorState description={tasks.error} action={<Button variant="ghost" onClick={tasks.reload}>Reintentar</Button>} />
      ) : !tasks.data || tasks.data.length === 0 ? (
        <EmptyState title="Sin tareas con estos filtros" description="Ajusta la prioridad o el responsable." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {GROUPS.map((g) => {
            const items = tasks.data!.filter((t) => t.status === g.key);
            return (
              <Card key={g.key} className="p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-[13.5px] font-bold">{g.label}</h2>
                  <span className="rounded-full bg-subtle-2 px-2 py-0.5 text-[12px] font-semibold text-muted">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map((t) => (
                    <div key={t.id} className={`rounded-lg border border-border p-3 ${t.status === "completed" ? "bg-subtle" : "bg-surface"}`}>
                      <div className="flex items-start gap-2.5">
                        <button onClick={() => toggle(t)} className="mt-0.5 shrink-0" aria-label="Completar tarea">
                          {t.status === "completed" ? (
                            <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-md bg-accent"><Check size={13} color="#fff" strokeWidth={3} /></span>
                          ) : (
                            <span className="inline-block h-[18px] w-[18px] rounded-md border-2 border-border-strong" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={`text-[13px] font-semibold leading-snug ${t.status === "completed" ? "text-faint line-through" : "text-ink"}`}>{t.title}</div>
                          <div className="mt-2"><Badge tone={priorityTone(t.priority)}>{priorityLabel(t.priority)}</Badge></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <div className="py-4 text-center text-[12.5px] text-faint">Sin tareas</div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
