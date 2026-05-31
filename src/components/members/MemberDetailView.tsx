"use client";

import { useState } from "react";
import { memberDetailApi } from "@/lib/api/member-detail";
import { membersApi } from "@/lib/api/members";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/ToastProvider";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ActivationScoreCard } from "@/components/ui/ActivationScoreCard";
import { RiskReasonPanel } from "@/components/ui/RiskReasonPanel";
import { SuggestedNextBestAction } from "@/components/ui/SuggestedNextBestAction";
import { ActivityFeed } from "@/components/ui/ActivityFeed";
import { AuditLog } from "@/components/ui/AuditLog";
import { ScoreTrend } from "@/components/ui/ScoreTrend";
import { AiSummaryCard } from "@/components/ui/AiSummaryCard";
import { MessageHistory } from "@/components/ui/MessageHistory";
import { InternalNotes, type NoteItem } from "@/components/ui/InternalNotes";
import { statusLabel, statusTone } from "@/lib/formatters";
import { Phone } from "lucide-react";
import type { Member } from "@/types";

export function MemberDetailView({ member, coachId }: { member: Member; coachId: string | null }) {
  const toast = useToast();
  const detail = useAsync(() => memberDetailApi.get(member.id), [member.id]);
  const notes = useAsync(() => memberDetailApi.notes(member.id), [member.id]);
  const [contacted, setContacted] = useState(false);

  async function markContacted() {
    try {
      await membersApi.markContacted(member.id);
      setContacted(true);
      toast.show(`${member.fullName.split(" ")[0]} marcada como contactada`);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "No se pudo marcar", "error");
    }
  }
  async function assignCoach() {
    try {
      await membersApi.assignCoach(member.id, coachId ?? "cph_a2");
      toast.show("Coach asignado");
      detail.reload();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "No se pudo asignar", "error");
    }
  }

  if (detail.loading) return <LoadingState rows={6} />;
  if (detail.error || !detail.data) return <ErrorState description={detail.error ?? "Sin datos"} action={<Button variant="ghost" onClick={detail.reload}>Reintentar</Button>} />;

  const d = detail.data;
  const i = d.insight;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <SuggestedNextBestAction
          action={{
            title: i.nextAction.title, detail: i.nextAction.detail,
            ctaKind: i.nextAction.ctaKind as never, templateCategory: i.nextAction.templateCategory,
          }}
          onAct={i.nextAction.ctaKind === "assign_coach" ? assignCoach : i.nextAction.ctaKind === "send_message" ? () => toast.show("Mensaje copiado") : undefined}
        />

        <AiSummaryCard summary={d.aiSummary} recommendedClass={d.recommendedClass} />

        <RiskReasonPanel findings={i.risk.findings} />

        <div className="grid gap-4 md:grid-cols-2">
          <ActivityFeed items={d.activity} />
          <MessageHistory items={d.messages} />
        </div>

        <InternalNotes memberId={member.id} initial={(notes.data as NoteItem[]) ?? []} />
      </div>

      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-muted">Estado</span>
            <Badge tone={statusTone(i.state.status as Member["status"])}>{statusLabel(i.state.status as Member["status"])}</Badge>
          </div>
          <p className="mt-2 text-[12px] text-muted">
            {i.state.source === "auto" ? "Derivado por reglas: " : "Manual: "}
            <span className="font-medium text-ink">{i.state.reason}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant={contacted ? "soft" : "primary"} icon={Phone} onClick={markContacted}>
              {contacted ? "Contactado" : "Marcar contactado"}
            </Button>
          </div>
        </Card>

        <ActivationScoreCard result={{ ...i.score, breakdown: i.score.breakdown }} />
        <ScoreTrend points={d.scoreHistory} />
        <AuditLog items={d.audit} />
      </div>
    </div>
  );
}
