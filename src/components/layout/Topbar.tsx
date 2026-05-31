"use client";

import { Menu, Search } from "lucide-react";
import { AppearanceSelector } from "@/components/theme/appearance-selector";

/** Barra superior: en móvil incluye el botón de menú. */
export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-surface px-5 py-3 md:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMenu}
          aria-label="Abrir navegación"
          className="rounded-lg border border-border-strong p-1.5 text-muted md:hidden"
        >
          <Menu size={18} />
        </button>
        <div className="hidden w-[260px] items-center gap-2 rounded-lg bg-subtle-2 px-3 py-1.5 sm:flex">
          <Search size={15} className="text-faint" />
          <input
            placeholder="Buscar socio, coach o tarea…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Acceso rápido a la apariencia: compacto, sin robar protagonismo */}
        <div className="hidden sm:block"><AppearanceSelector compact /></div>
        <span className="hidden text-[12.5px] font-medium text-muted sm:inline">CrossBox Centro</span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-avatar-bg text-[12px] font-semibold text-avatar-fg">CN</span>
      </div>
    </header>
  );
}
