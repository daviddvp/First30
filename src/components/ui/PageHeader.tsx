/** Cabecera estándar de pantalla: eyebrow + título + descripción + acción. */
export function PageHeader({
  eyebrow, title, description, action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[11.5px] font-bold uppercase tracking-wide text-accent-strong">{eyebrow}</div>
        <h1 className="mt-1 text-[22px] font-extrabold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[14px] text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
