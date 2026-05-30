import { cn } from "@/lib/utils";

/** Contenedor base. Bordes suaves, fondo surface. `lift` añade hover elevado. */
export function Card({
  children, className, lift = false,
}: {
  children: React.ReactNode;
  className?: string;
  lift?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-surface",
      lift && "transition hover:border-border-strong hover:shadow-lift",
      className,
    )}>
      {children}
    </div>
  );
}
