import { Card } from "./Card";
import { Badge } from "./Badge";
import { formatRelative } from "@/lib/formatters";

export interface MessageItem { id: string; body: string; status: string; channel: string; createdAt: string; }

/** Historial de mensajes del socio (lectura). */
export function MessageHistory({ items }: { items: MessageItem[] }) {
  return (
    <Card className="p-4">
      <h3 className="mb-3 text-[14px] font-bold">Historial de mensajes</h3>
      {items.length === 0 ? (
        <p className="py-3 text-center text-[12.5px] text-faint">Aún no se han enviado mensajes.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((m) => (
            <li key={m.id} className="rounded-lg border border-border p-3">
              <div className="mb-1 flex items-center justify-between">
                <Badge tone={m.status === "sent" ? "success" : "neutral"}>{m.status === "sent" ? "Enviado" : "Copiado"} · {m.channel}</Badge>
                <span className="text-[11px] text-faint">{formatRelative(m.createdAt)}</span>
              </div>
              <p className="line-clamp-2 text-[12.5px] text-muted">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
