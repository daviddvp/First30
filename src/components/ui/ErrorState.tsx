import { AlertCircle } from "lucide-react";

/** Estado de error reutilizable, con acción opcional de reintento. */
export function ErrorState({
  title = "No hemos podido cargar esta sección",
  description = "Vuelve a intentarlo en unos segundos. Si el problema continúa, contacta con soporte.",
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-danger-soft bg-danger-soft/40 px-6 py-14 text-center">
      <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-danger-soft text-danger-strong">
        <AlertCircle size={20} strokeWidth={2} />
      </span>
      <h3 className="text-[15px] font-bold text-danger-strong">{title}</h3>
      <p className="mt-1 max-w-sm text-[13.5px] text-danger-strong/80">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
