// NOTA DE SEGURIDAD: recibe orgId directamente porque es una capa de lectura
// interna consumida por member-detail.service (que ya valida permisos).
// No exponer en route handlers sin validar permisos primero.
import { prisma } from "@/lib/db";
import { memberRepository } from "../repositories/member.repository";
import { computeActivationScore, type ActivationScoreResult } from "@/lib/activation-score";
import { evaluateRisk, type RiskResult } from "@/lib/risk-engine";
import { deriveStatus, type OnboardingState } from "@/lib/onboarding-engine";
import { nextBestAction, type NextBestAction } from "@/lib/next-best-action";
import type { MemberContext } from "@/lib/engine-input";
import { NotFoundError } from "@/lib/errors";
import type { ID, Attendance, CheckIn, OnboardingRule, RiskAlert } from "@/types";

export interface MemberInsight {
  score: ActivationScoreResult;
  risk: RiskResult;
  state: OnboardingState;
  nextAction: NextBestAction;
}

export async function buildMemberContext(orgId: ID, memberId: ID): Promise<MemberContext> {
  const member = await memberRepository.findById(orgId, memberId);
  if (!member) throw new NotFoundError("Socio");

  const [attendanceRows, checkInRows, alertRows, ruleRows] = await Promise.all([
    prisma.attendance.findMany({ where: { organizationId: orgId, memberId }, orderBy: { classDate: "asc" } }),
    prisma.checkIn.findMany({ where: { organizationId: orgId, memberId }, orderBy: { createdAt: "asc" } }),
    prisma.riskAlert.findMany({ where: { organizationId: orgId, memberId, status: { in: ["open", "snoozed"] } } }),
    prisma.onboardingRule.findMany({ where: { organizationId: orgId } }),
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
  const openAlerts: RiskAlert[] = alertRows.map((a) => ({
    id: a.id, organizationId: a.organizationId, memberId: a.memberId,
    riskLevel: a.riskLevel as RiskAlert["riskLevel"],
    reason: a.reason, daysSinceLastAttendance: a.daysSinceLastAttendance,
    suggestedAction: a.suggestedAction, suggestedMessage: a.suggestedMessage,
    priority: a.priority as RiskAlert["priority"],
    status: a.status as RiskAlert["status"],
    resolvedAt: null, resolvedNote: null, snoozeUntil: null, ruleKey: a.ruleKey,
    createdAt: a.createdAt.toISOString(), updatedAt: a.updatedAt.toISOString(),
  }));
  const rules: OnboardingRule[] = ruleRows.map((r) => ({
    id: r.id, organizationId: r.organizationId, type: r.type as OnboardingRule["type"],
    enabled: r.enabled, thresholdValue: r.thresholdValue ?? 0, action: r.action ?? "",
    createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
  }));

  const hasUpcomingClass = member.status === "activated" || member.status === "in_progress";
  const cancellationStreak = /cancel/i.test(member.riskReason ?? "") ? 2 : 0;
  return { organizationId: orgId, member, attendances, checkIns, openAlerts, rules, hasUpcomingClass, cancellationStreak };
}

export const insightService = {
  async forMember(orgId: ID, memberId: ID): Promise<MemberInsight> {
    const ctx = await buildMemberContext(orgId, memberId);
    return {
      score: computeActivationScore(ctx),
      risk: evaluateRisk(ctx),
      state: deriveStatus(ctx),
      nextAction: nextBestAction(ctx),
    };
  },

  async riskForOrg(orgId: ID) {
    const members = await memberRepository.list(orgId);
    const results = await Promise.all(members.map((m) => insightService.forMember(orgId, m.id)));
    return results
      .filter((i) => i.risk.findings.length > 0)
      .sort((a, b) => {
        const o: Record<string, number> = { high: 3, medium: 2, low: 1 };
        return (o[b.risk.topRisk] ?? 0) - (o[a.risk.topRisk] ?? 0);
      });
  },
};
