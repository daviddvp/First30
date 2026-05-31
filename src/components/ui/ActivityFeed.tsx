import { Card } from "./Card";
import { Dumbbell, ClipboardCheck, MessageSquare } from "lucide-react";
import { formatRelative } from "@/lib/formatters";

export interface ActivityItem { id: string; kind: string; label: string; date: string; }
const ICON: Record<string, typeof Dumbbell> = { attendance: Dumbbell, checkin: ClipboardCheck, message: MessageSquare };

/** Actividad reciente del socio (lectura). */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-[14px] font-bold">Actividad reciente</h3>
      {items.length === 0 ? (
        <p className="py-3 text-center text-[12.5px] text-faint">Sin actividad registrada.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it) => {
            const Icon = ICON[it.kind] ?? MessageSquare;
            return (
              <li key={it.id} className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-subtle-2 text-muted">
                  <Icon size={14} />
                </span>
                <span className="flex-1 text-[13px]">{it.label}</span>
                <span className="text-[11.5px] text-faint">{formatRelative(it.date)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
