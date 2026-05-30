import { PageHeader } from "@/components/ui/PageHeader";
import { PlaceholderPanel } from "@/components/ui/PlaceholderPanel";
import { Button } from "@/components/ui/Button";
import { Plus, Table, PanelRight, Filter } from "lucide-react";

export default function MembersPage() {
  return (
    <>
      <PageHeader
        eyebrow="Operación"
        title="Nuevos socios"
        description="El listado operativo de cada socio en sus primeros 30 días: estado, coach, objetivo y próxima acción."
        action={<Button icon={Plus}>Añadir socio</Button>}
      />
      <PlaceholderPanel
        summary="Aquí vivirá la tabla central del equipo. Cada fila será un socio en onboarding, con su día del proceso, coach asignado, última asistencia y la acción recomendada por First30."
        features={[
          { icon: Table, title: "Tabla operativa", description: "Nombre, alta, día de onboarding, coach, objetivo, nivel y estado en una sola vista." },
          { icon: Filter, title: "Filtros por estado y riesgo", description: "Aísla a quién falta coach, quién no ha vuelto o quién ya está activado." },
          { icon: PanelRight, title: "Ficha lateral", description: "Al seleccionar un socio se abrirá su detalle con timeline y mensajes sugeridos." },
        ]}
        note="Próxima fase: conectar el modelo de datos de socios y la ficha de detalle."
      />
    </>
  );
}
