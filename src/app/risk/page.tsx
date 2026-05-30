import { PageHeader } from "@/components/ui/PageHeader";
import { PlaceholderPanel } from "@/components/ui/PlaceholderPanel";
import { AlertTriangle, Activity, MessageSquare, Layers } from "lucide-react";

export default function RiskPage() {
  return (
    <>
      <PageHeader
        eyebrow="Retención"
        title="Socios en riesgo"
        description="El radar de abandono temprano: quién está a punto de perderse en su primer mes y qué hacer al respecto."
      />
      <PlaceholderPanel
        summary="Esta pantalla agrupará a los socios por nivel de riesgo y explicará el motivo de cada alerta, con una acción y un mensaje sugerido listos para usar."
        features={[
          { icon: Layers, title: "Agrupado por riesgo", description: "Alto, medio y bajo, para priorizar dónde actúa primero el equipo." },
          { icon: AlertTriangle, title: "Motivo de la alerta", description: "No volvió tras la 1ª clase, sin 2ª visita en 7 días, sin coach, etc." },
          { icon: MessageSquare, title: "Acción y mensaje", description: "Cada alerta llevará una acción sugerida y una plantilla copiable." },
        ]}
        note="Próxima fase: derivar las alertas desde el motor de reglas, no escribirlas a mano."
      />
    </>
  );
}
