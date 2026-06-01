import { auditRepository } from "../repositories/audit.repository";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/permissions";
import type { RequestContext } from "@/lib/auth";

export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  metadataSummary: string | null;
  createdAt: string;
}

export const auditService = {
  async recent(ctx: RequestContext, limit = 20): Promise<AuditEntry[]> {
    assertCan(ctx.user, "report.read");
    const [logs, users] = await Promise.all([
      auditRepository.list(ctx.organizationId, limit),
      prisma.user.findMany({ where: { organizationId: ctx.organizationId }, select: { id: true, name: true } }),
    ]);
    const userMap = new Map(users.map((u) => [u.id, u.name]));
    return logs.map((a) => ({
      id: a.id,
      actorName: a.actorUserId ? userMap.get(a.actorUserId) ?? "Sistema" : "Sistema",
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      metadataSummary: a.metadata
        ? Object.entries(a.metadata).map(([k, v]) => `${k}: ${v}`).join(", ")
        : null,
      createdAt: a.createdAt,
    }));
  },
};
