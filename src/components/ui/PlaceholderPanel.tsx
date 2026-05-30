import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

type Feature = { icon: LucideIcon; title: string; description: string };

/** Panel de "qué vivirá aquí": comunica el propósito de la pantalla
 *  mientras no hay datos/lógica, sin parecer una demo vacía. */
export function PlaceholderPanel({
  summary, features, note,
}: {
  summary: string;
  features: Feature[];
  note?: string;
}) {
  return (
    <div className="fade-in space-y-4">
      <Card className="p-5">
        <p className="text-[14.5px] leading-relaxed text-ink">{summary}</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title} lift className="p-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
              <f.icon size={18} strokeWidth={2.1} />
            </span>
            <h3 className="mt-3 text-[14px] font-bold">{f.title}</h3>
            <p className="mt-1 text-[13px] leading-snug text-muted">{f.description}</p>
          </Card>
        ))}
      </div>

      {note && (
        <p className="text-[12.5px] text-faint">{note}</p>
      )}
    </div>
  );
}
