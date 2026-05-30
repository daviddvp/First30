import { PageHeader } from "@/components/ui/PageHeader";
import { PlaceholderPanel } from "@/components/ui/PlaceholderPanel";
import { SlidersHorizontal, CalendarDays, ListChecks } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ajustes"
        title="Configuración"
        description="Las reglas de onboarding de tu box: días clave, umbrales de alerta, plantillas, coaches y branding."
      />
      <PlaceholderPanel
        summary="Desde aquí se configurará cómo funciona el onboarding: qué días son hito, cuándo se crea una alerta y qué plantillas usa el equipo."
        features={[
          { icon: CalendarDays, title: "Días clave", description: "Día 0, 1, 3, 7, 14, 21 y 30 como hitos que generan acciones." },
          { icon: SlidersHorizontal, title: "Reglas de riesgo", description: "Umbrales: sin volver en 7 días, <2 asistencias en 14, sin coach…" },
          { icon: ListChecks, title: "Checklist y branding", description: "Pasos obligatorios del onboarding y datos del box en los informes." },
        ]}
        note="Próxima fase: persistir la configuración y aplicarla al motor de reglas."
      />
    </>
  );
}
