"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";

/** Marco persistente de la aplicación: sidebar + topbar + área de contenido. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-5 py-6 md:px-7">{children}</main>
      </div>
      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
