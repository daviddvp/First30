import { Brand } from "./Brand";
import { NavLinks } from "./NavLinks";

/** Navegación lateral fija en desktop. */
export function Sidebar() {
  return (
    <aside className="hidden w-[244px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
      <div className="px-5 py-5">
        <Brand />
      </div>
      <div className="flex-1 px-3">
        <NavLinks />
      </div>
      <div className="p-3">
        <div className="rounded-xl bg-accent-soft p-3">
          <div className="text-[12px] font-bold text-accent-strong">Activación 30 días</div>
          <p className="mt-0.5 text-[12px] text-accent-strong/85">
            Sigue aquí qué socios se integran en su primer mes.
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2.5 px-1">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#eceae4] text-[12px] font-semibold text-[#55534c]">CN</span>
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold">Carla Núñez</div>
            <div className="text-[11px] text-faint">Owner · CrossBox Centro</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
