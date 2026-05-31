/* Compone el detalle enriquecido de un socio para la ficha: insight (motores),
   actividad reciente, historial de mensajes, próxima clase y resumen simulado.
   Toda la lógica vive aquí; la UI solo pinta el resultado. */
import { orgScope } from "@/data/mock-db";
import { insightService } from "./insight.service";
import { assertCan } from "@/lib/permissions";
import { scopedView } from "@/lib/tenant-scope";
import { NotFoundError } from "@/lib/errors";
import { firstName } from "@/lib/formatters";
import type { RequestContext } from "@/lib/auth";
import type { ID, Attendance, CheckIn, MessageLog, AuditLog } from "@/types";
import type { MemberInsight } from "./insight.service";

export interface ActivityItem {
  id: string;
  kind: "attendance" | "checkin" | "message" | "alert" | "audit";
  label: string;
  date: string;
}
export interface ScorePoint { day: number; score: number; }

export interface MemberDetail {
  insight: MemberInsight;
  coachName: string | null;
  activity: ActivityItem[];
  messages: MessageLog[];
  audit: AuditLog[];
  scoreHistory: ScorePoint[];
  recommendedClass: string;
  aiSummary: string;
}

/** Serie sintética de evolución del score, anclada al score actual. */
function buildScoreHistory(current: number, day: number): ScorePoint[] {
  const marks = [0, 3, 7, 14, 21, 30].filter((d) => d <= Math.max(day, 1));
  return marks.map((d, i) => {
    const ramp = marks.length > 1 ? i / (marks.length - 1) : 1;
    const base = Math.round(20 + (current - 20) * ramp);
    return { day: d, score: Math.max(0, Math.min(100, base)) };
  });
}

function recommendClass(goal: string, level: string): string {
  const byGoal: Record<string, string> = {
    "Perder peso": "HIIT suave, miércoles 18:00",
    "Ganar fuerza": "Fuerza guiada, martes 19:00",
    "Competir": "Técnica de halterofilia, jueves 17:00",
    "Volver al deporte": "Movilidad y acondicionamiento, lunes 10:00",
    "Salud general": "WOD adaptado, miércoles 19:00",
  };
  return byGoal[goal] ?? `Clase de iniciación acorde a nivel ${level.toLowerCase()}`;
}

function buildAiSummary(name: string, insight: MemberInsight, atts: number): string {
  const n = firstName(name);
  const risk = insight.risk.findings[0];
  const lead = `${n} lleva ${atts} ${atts === 1 ? "asistencia" : "asistencias"} registradas y un Activation Score de ${insight.score.score}/100.`;
  const body = risk
    ? ` El sistema detecta riesgo ${insight.risk.topRisk === "high" ? "alto" : insight.risk.topRisk === "medium" ? "medio" : "bajo"}: ${risk.reason.toLowerCase()}.`
    : " Su evolución es estable y sin señales de riesgo.";
  const action = ` Recomendación: ${insight.nextAction.title.toLowerCase()}.`;
  return lead + body + action;
}

export const memberDetailService = {
  forMember(ctx: RequestContext, memberId: ID): MemberDetail {
    const view = scopedView(ctx);
    assertCan(ctx.user, "member.read", { ownerCoachId: view.ownerCoachOf(memberId) });
    if (!view.canSeeMember(memberId)) throw new NotFoundError("Socio");

    const scope = orgScope(ctx.organizationId);
    const member = scope.member(memberId)!;
    const insight = insightService.forMember(ctx.organizationId, memberId);
    const coach = scope.coachOfMember(memberId);
    const coachName = coach ? scope.userOfCoach(coach.id)?.name ?? null : null;

    const attendances = scope.attendancesByMember(memberId);
    const checkIns = scope.checkInsByMember(memberId);
    const messages = scope.messageLogsByMember(memberId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const audit = scope.auditLogs()
      .filter((a) => a.entityId === memberId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

    const activity: ActivityItem[] = [
      ...attendances.map((a: Attendance) => ({ id: a.id, kind: "attendance" as const, label: `Asistió a ${a.classType}`, date: a.classDate })),
      ...checkIns.map((c: CheckIn) => ({ id: c.id, kind: "checkin" as const, label: `Check-in día ${c.day} · ${c.status}`, date: c.createdAt })),
      ...messages.map((m: MessageLog) => ({ id: m.id, kind: "message" as const, label: `Mensaje ${m.status === "sent" ? "enviado" : "copiado"}`, date: m.createdAt })),
    ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8);

    return {
      insight, coachName, activity, messages, audit,
      scoreHistory: buildScoreHistory(insight.score.score, member.onboardingDay),
      recommendedClass: recommendClass(member.mainGoal, member.level),
      aiSummary: buildAiSummary(member.fullName, insight, attendances.length),
    };
  },
};
