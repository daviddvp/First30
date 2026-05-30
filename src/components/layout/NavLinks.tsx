"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition",
              active
                ? "border border-border bg-surface shadow-card text-ink"
                : "border border-transparent text-muted hover:bg-surface/70",
            )}
          >
            <Icon size={17} strokeWidth={2.1} className={active ? "text-accent-strong" : "text-faint"} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className={cn(
                "tnum rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                item.tone === "danger" ? "bg-danger-soft text-danger-strong" : "bg-[#f0efeb] text-muted",
              )}>
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
