import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/** Estado vacío amable: úsalo cuando una vista no tiene elementos todavía. */
export function EmptyState({
  icon: Icon = Inbox, title, description, action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
      <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0efeb] text-muted">
        <Icon size={20} strokeWidth={2} />
      </span>
      <h3 className="text-[15px] font-bold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13.5px] text-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
