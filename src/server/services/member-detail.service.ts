import { prisma } from "@/lib/db";
import { memberRepository } from "../repositories/member.repository";
import { messageRepository } from "../repositories/message.repository";
import { auditRepository } from "../repositories/audit.repository";
import { insightService } from "./insight.service";
import { assertCan } from "@/lib/permissions";
import { canSeeMember, ownerCoachOf } from "@/lib/tenant-scope";
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
  async forMember(ctx: RequestContext, memberId: ID): Promise<MemberDetail> {
    const member = await memberRepository.findById(ctx.organizationId, memberId);
    if (!member) throw new NotFoundError("Socio");

    assertCan(ctx.user, "member.read", { ownerCoachId: ownerCoachOf(member.assignedCoachId) });
    if (!canSeeMember(ctx, member.assignedCoachId)) throw new NotFoundError("Socio");

    const [insight, messages, auditLogs, attendanceRows, checkInRows, coachUser] = await Promise.all([
      insightService.forMember(ctx.organizationId, memberId),
      messageRepository.logsByMember(ctx.organizationId, memberId),
      auditRepository.listByEntity(ctx.organizationId, "Member", memberId),
      prisma.attendance.findMany({ where: { organizationId: ctx.organizationId, memberId }, orderBy: { classDate: "desc" } }),
      prisma.checkIn.findMany({ where: { organizationId: ctx.organizationId, memberId }, orderBy: { createdAt: "desc" } }),
      member.assignedCoachId
        ? prisma.user.findFirst({ where: { coachProfile: { id: member.assignedCoachId }, organizationId: ctx.organizationId }, select: { name: true } })
        : Promise.resolve(null),
    ]);

    const attendances: Attendance[] = attendanceRows.map((a) => ({
      id: a.id, organizationId: a.organizationId, memberId: a.memberId,
      classDate: a.classDate.toISOString(), classType: a.classType ?? "WOD",
      coachId: a.coachId ?? "", notes: a.notes, createdAt: a.createdAt.toISOString(),
    }));
    const checkIns: CheckIn[] = checkInRows.map((c) => ({
      id: c.id, organizationId: c.organizationId, memberId: c.memberId,
      coachId: c.coachId ?? null, day: c.day,
      status: c.status as CheckIn["status"],
      sentiment: c.sentiment as CheckIn["sentiment"],
      notes: c.notes, createdAt: c.createdAt.toISOString(),
    }));

    const activity: ActivityItem[] = [
      ...attendances.map((a) => ({ id: a.id, kind: "attendance" as const, label: `Asistió a ${a.classType}`, date: a.classDate })),
      ...checkIns.map((c) => ({ id: c.id, kind: "checkin" as const, label: `Check-in día ${c.day} · ${c.status}`, date: c.createdAt })),
      ...messages.map((m) => ({ id: m.id, kind: "message" as const, label: `Mensaje ${m.status === "sent" ? "enviado" : "copiado"}`, date: m.createdAt })),
    ].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 8);

    return {
      insight, coachName: coachUser?.name ?? null,
      activity, messages, audit: auditLogs,
      scoreHistory: buildScoreHistory(insight.score.score, member.onboardingDay),
      recommendedClass: recommendClass(member.mainGoal, member.level),
      aiSummary: buildAiSummary(member.fullName, insight, attendances.length),
    };
  },
};
