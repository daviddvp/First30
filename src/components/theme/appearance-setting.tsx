"use client";

import { Card } from "@/components/ui/Card";
import { AppearanceSelector } from "./appearance-selector";

/** Sección "Aspecto" para la pantalla de Configuración. */
export function AppearanceSetting() {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[14px] font-bold">Aspecto</h2>
          <p className="mt-0.5 max-w-md text-[12.5px] text-muted">
            Controla cómo se muestra First30 en este dispositivo. El modo Sistema seguirá la apariencia configurada en tu equipo.
          </p>
        </div>
        <div className="shrink-0">
          <AppearanceSelector />
        </div>
      </div>
    </Card>
  );
}
