import { PageHeader } from "@/components/ui/PageHeader";
import { PlaceholderPanel } from "@/components/ui/PlaceholderPanel";
import { Button } from "@/components/ui/Button";
import { MessageSquare, Copy, UserCheck, Plus } from "lucide-react";

export default function MessagesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Comunicación"
        title="Mensajes"
        description="La biblioteca de plantillas para acompañar a cada socio en el momento adecuado, con un tono cercano y profesional."
        action={<Button variant="ghost" icon={Plus}>Nueva plantilla</Button>}
      />
      <PlaceholderPanel
        summary="Plantillas organizadas por momento del onboarding (bienvenida, tras la primera clase, sin volver en 7 días, día 30…), listas para personalizar y copiar."
        features={[
          { icon: MessageSquare, title: "Por momento", description: "Cada plantilla cubre una situación concreta del primer mes." },
          { icon: UserCheck, title: "Personalización", description: "Inserta el nombre del socio automáticamente antes de enviar." },
          { icon: Copy, title: "Copiar y marcar", description: "Copia con un clic y marca la plantilla como usada." },
        ]}
        note="Próxima fase: conectar plantillas con socios y registro de uso."
      />
    </>
  );
}
