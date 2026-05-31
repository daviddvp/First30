import { cn } from "@/lib/utils";

/** Skeleton genérico para estados de carga (sin datos aún). */
export function LoadingState({ rows = 3, label = "Cargando…" }: { rows?: number; label?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-avatar-bg" />
            <div className="flex-1 space-y-2">
              <div className={cn("h-3 animate-pulse rounded bg-avatar-bg", i % 2 ? "w-1/3" : "w-1/2")} />
              <div className="h-3 w-2/3 animate-pulse rounded bg-subtle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
