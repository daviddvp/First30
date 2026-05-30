import { PageHeader } from "@/components/ui/PageHeader";
import { PlaceholderPanel } from "@/components/ui/PlaceholderPanel";
import { Button } from "@/components/ui/Button";
import { CheckSquare, Columns3, Zap, Plus } from "lucide-react";

export default function TasksPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ejecución"
        title="Tareas"
        description="Las acciones pendientes del equipo durante el onboarding, generadas automáticamente por las reglas de First30."
        action={<Button variant="ghost" icon={Plus}>Nueva tarea</Button>}
      />
      <PlaceholderPanel
        summary="Un tablero con las tareas agrupadas por momento (hoy, esta semana, pendientes y completadas), cada una vinculada a un socio y a un coach responsable."
        features={[
          { icon: Columns3, title: "Tablero por momento", description: "Hoy, esta semana, pendientes y completadas, de un vistazo." },
          { icon: Zap, title: "Tareas automáticas", description: "Enviar mensaje post 1ª clase, contactar sin 2ª visita, asignar coach…" },
          { icon: CheckSquare, title: "Completar al instante", description: "Marcar una tarea como hecha con un clic, con feedback visual." },
        ]}
        note="Próxima fase: generar tareas desde eventos del onboarding."
      />
    </>
  );
}
