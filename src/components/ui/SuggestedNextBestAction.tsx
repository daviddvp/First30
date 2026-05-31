import { Card } from "./Card";
import { Button } from "./Button";
import { Sparkles, UserPlus, MessageSquare, ClipboardList, FileText, CalendarPlus } from "lucide-react";
import type { NextBestAction, ActionCtaKind } from "@/lib/next-best-action";

const ICON: Record<ActionCtaKind, typeof Sparkles> = {
  assign_coach: UserPlus, send_message: MessageSquare, review_scaling: ClipboardList,
  send_summary: FileText, schedule_class: CalendarPlus, none: Sparkles,
};
const CTA_LABEL: Record<ActionCtaKind, string> = {
  assign_coach: "Asignar coach", send_message: "Copiar mensaje", review_scaling: "Revisar escalados",
  send_summary: "Generar resumen", schedule_class: "Recomendar clase", none: "Hecho",
};

/** Tarjeta destacada con la siguiente mejor acción (del motor next-best-action). */
export function SuggestedNextBestAction({ action, onAct }: { action: NextBestAction; onAct?: () => void }) {
  const Icon = ICON[action.ctaKind];
  return (
    <Card className="p-4" lift>
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11.5px] font-bold uppercase tracking-wide text-accent-strong">Siguiente mejor acción</div>
          <h3 className="mt-0.5 text-[15px] font-bold">{action.title}</h3>
          <p className="mt-1 text-[13px] text-muted">{action.detail}</p>
          {action.ctaKind !== "none" && (
            <div className="mt-3">
              <Button variant="primary" icon={Icon} onClick={onAct}>{CTA_LABEL[action.ctaKind]}</Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
