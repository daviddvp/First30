import { prisma } from "@/lib/db";
import type { ID, RiskAlert, RiskLevel, AlertStatus } from "@/types";

export interface AlertFilters {
  riskLevel?: RiskLevel;
  status?: AlertStatus;
  memberId?: ID;
  /** Si se pasa, solo alertas de socios asignados a este coach. */
  forCoachId?: ID;
}

const RISK_ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };

export const alertRepository = {
  async list(orgId: ID, f: AlertFilters = {}): Promise<RiskAlert[]> {
    let memberIds: string[] | undefined;
    if (f.forCoachId) {
      const members = await prisma.member.findMany({
        where: { organizationId: orgId, assignedCoachId: f.forCoachId },
        select: { id: true },
      });
      memberIds = members.map((m) => m.id);
      if (memberIds.length === 0) return [];
    }

    const rows = await prisma.riskAlert.findMany({
      where: {
        organizationId: orgId,
        ...(f.riskLevel && { riskLevel: f.riskLevel }),
        ...(f.status    && { status: f.status }),
        ...(f.memberId  && { memberId: f.memberId }),
        ...(memberIds   && { memberId: { in: memberIds } }),
      },
    });
    return rows.map(toAlert).sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]);
  },

  async findById(orgId: ID, id: ID): Promise<RiskAlert | undefined> {
    const row = await prisma.riskAlert.findFirst({
      where: { id, organizationId: orgId },
    });
    return row ? toAlert(row) : undefined;
  },

  async update(orgId: ID, id: ID, patch: Partial<RiskAlert>): Promise<RiskAlert | undefined> {
    const exists = await prisma.riskAlert.findFirst({ where: { id, organizationId: orgId }, select: { id: true } });
    if (!exists) return undefined;

    const row = await prisma.riskAlert.update({
      where: { id },
      data: {
        ...(patch.status      !== undefined && { status: patch.status }),
        ...(patch.resolvedAt  !== undefined && { resolvedAt: patch.resolvedAt ? new Date(patch.resolvedAt) : null }),
        ...(patch.resolvedNote !== undefined && { resolvedNote: patch.resolvedNote }),
        ...(patch.snoozeUntil !== undefined && { snoozeUntil: patch.snoozeUntil ? new Date(patch.snoozeUntil) : null }),
        ...(patch.riskLevel   !== undefined && { riskLevel: patch.riskLevel }),
        ...(patch.priority    !== undefined && { priority: patch.priority }),
      },
    });
    return toAlert(row);
  },

  async create(orgId: ID, data: Omit<RiskAlert, "id" | "organizationId" | "createdAt" | "updatedAt">): Promise<RiskAlert> {
    const row = await prisma.riskAlert.create({
      data: {
        organizationId: orgId,
        memberId: data.memberId,
        riskLevel: data.riskLevel,
        reason: data.reason,
        daysSinceLastAttendance: data.daysSinceLastAttendance ?? null,
        suggestedAction: data.suggestedAction ?? null,
        suggestedMessage: data.suggestedMessage ?? null,
        priority: data.priority,
        status: data.status,
        resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
        resolvedNote: data.resolvedNote ?? null,
        snoozeUntil: data.snoozeUntil ? new Date(data.snoozeUntil) : null,
        ruleKey: data.ruleKey ?? null,
      },
    });
    return toAlert(row);
  },

  /** Busca una alerta abierta por ruleKey (para deduplicación del job). */
  async findOpenByRuleKey(orgId: ID, ruleKey: string): Promise<RiskAlert | undefined> {
    const row = await prisma.riskAlert.findFirst({
      where: { organizationId: orgId, ruleKey, status: { in: ["open", "snoozed"] } },
    });
    return row ? toAlert(row) : undefined;
  },
};

function toAlert(p: {
  id: string; organizationId: string; memberId: string; riskLevel: string;
  reason: string; daysSinceLastAttendance: number | null; suggestedAction: string | null;
  suggestedMessage: string | null; priority: string; status: string;
  resolvedAt: Date | null; resolvedNote: string | null; snoozeUntil: Date | null;
  ruleKey: string | null; createdAt: Date; updatedAt: Date;
}): RiskAlert {
  return {
    id: p.id, organizationId: p.organizationId, memberId: p.memberId,
    riskLevel: p.riskLevel as RiskAlert["riskLevel"],
    reason: p.reason, daysSinceLastAttendance: p.daysSinceLastAttendance,
    suggestedAction: p.suggestedAction,
    suggestedMessage: p.suggestedMessage,
    priority: p.priority as RiskAlert["priority"],
    status: p.status as RiskAlert["status"],
    resolvedAt: p.resolvedAt?.toISOString() ?? null,
    resolvedNote: p.resolvedNote,
    snoozeUntil: p.snoozeUntil?.toISOString() ?? null,
    ruleKey: p.ruleKey,
    createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
  };
}
