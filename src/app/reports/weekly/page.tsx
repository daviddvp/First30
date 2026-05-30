import { PageHeader } from "@/components/ui/PageHeader";
import { PlaceholderPanel } from "@/components/ui/PlaceholderPanel";
import { Button } from "@/components/ui/Button";
import { FileText, TrendingUp, Send, Download } from "lucide-react";

export default function WeeklyReportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Dirección"
        title="Informe semanal de onboarding"
        description="El reporte ejecutivo de la semana: métricas clave, riesgos prioritarios y un resumen listo para enviar a dirección."
        action={<Button variant="ghost" icon={Download}>Descargar PDF</Button>}
      />
      <PlaceholderPanel
        summary="Reunirá los nuevos socios de la semana, quién hizo la segunda visita, las métricas de activación y un bloque de resumen redactado para la propiedad del box."
        features={[
          { icon: TrendingUp, title: "Métricas clave", description: "Second Visit Rate, Activation Rate y asistencia media en 14 días." },
          { icon: FileText, title: "Resumen para dirección", description: "Un párrafo redactado automáticamente con lo esencial de la semana." },
          { icon: Send, title: "Listo para enviar", description: "Descarga en PDF, envío por email o copia del resumen." },
        ]}
        note="Próxima fase: generar el informe a partir de los datos de la semana."
      />
    </>
  );
}
