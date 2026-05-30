"use client";

import { X } from "lucide-react";
import { Brand } from "./Brand";
import { NavLinks } from "./NavLinks";

/** Drawer de navegación para móvil/tablet. */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink/30" onClick={onClose} />
      <div className="slide-in absolute inset-y-0 left-0 flex w-[260px] flex-col border-r border-border bg-sidebar">
        <div className="flex items-center justify-between px-5 py-5">
          <Brand />
          <button onClick={onClose} aria-label="Cerrar navegación" className="rounded-lg p-1.5 text-muted">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 px-3">
          <NavLinks onNavigate={onClose} />
        </div>
      </div>
    </div>
  );
}
