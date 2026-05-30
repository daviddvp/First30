import { PageHeader } from "@/components/ui/PageHeader";
import { PlaceholderPanel } from "@/components/ui/PlaceholderPanel";
import { Users, Gauge, CalendarClock } from "lucide-react";

export default function CoachesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Equipo"
        title="Coaches"
        description="Carga de seguimiento y nuevos socios asignados a cada coach, para repartir el acompañamiento de forma equilibrada."
      />
      <PlaceholderPanel
        summary="Mostrará a cada coach con sus socios en onboarding, tareas pendientes y completadas, socios en riesgo bajo su seguimiento y un indicador de carga."
        features={[
          { icon: Users, title: "Socios asignados", description: "Cuántos nuevos socios acompaña cada coach durante su primer mes." },
          { icon: Gauge, title: "Indicador de carga", description: "Señala quién está saturado y quién puede asumir más seguimiento." },
          { icon: CalendarClock, title: "Verá hoy", description: "Detalle con los nuevos socios que el coach verá en sus clases de hoy." },
        ]}
        note="Próxima fase: vincular coaches con socios y tareas reales."
      />
    </>
  );
}
