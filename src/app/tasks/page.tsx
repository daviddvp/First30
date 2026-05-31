import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { orgScope } from "@/data/mock-db";
import { resolveDefaultOrg } from "@/lib/tenant";
import { TasksView } from "@/components/tasks/TasksView";

export const dynamic = "force-dynamic";

export default function TasksPage() {
  const scope = orgScope(resolveDefaultOrg());
  // Responsables disponibles (usuarios de la organización) para el filtro.
  const assignees = [
    { value: "", label: "Todos" },
    ...scope.users().map((u) => ({ value: u.id, label: u.name })),
  ];
  return (
    <div className="fade-in">
      <PageHeader eyebrow="Ejecución" title="Tareas"
        description="Acciones del equipo durante el onboarding. Filtra por prioridad o responsable y complétalas con un clic."
        action={<Button variant="ghost" icon={Plus}>Nueva tarea</Button>} />
      <TasksView assignees={assignees} />
    </div>
  );
}
