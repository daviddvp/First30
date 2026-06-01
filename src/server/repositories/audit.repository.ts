import { prisma } from "@/lib/db";
import type { ID, AuditLog, AuditAction } from "@/types";

export const auditRepository = {
  async record(
    orgId: ID,
    actorUserId: ID | null,
    entityType: string,
    entityId: ID,
    action: AuditAction | string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        organizationId: orgId,
        actorUserId: actorUserId ?? null,
        entityType,
        entityId,
        action,
        metadata: metadata ? (metadata as import("@prisma/client").Prisma.InputJsonValue) : undefined,
      },
    });
  },

  async list(orgId: ID, limit = 50): Promise<AuditLog[]> {
    const rows = await prisma.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(toAuditLog);
  },

  async listByEntity(orgId: ID, entityType: string, entityId: ID): Promise<AuditLog[]> {
    const rows = await prisma.auditLog.findMany({
      where: { organizationId: orgId, entityType, entityId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toAuditLog);
  },
};

function toAuditLog(p: {
  id: string; organizationId: string; actorUserId: string | null;
  entityType: string; entityId: string; action: string;
  metadata: unknown; createdAt: Date;
}): AuditLog {
  return {
    id: p.id,
    organizationId: p.organizationId,
    actorUserId: p.actorUserId ?? "",
    entityType: p.entityType,
    entityId: p.entityId,
    action: p.action as AuditLog["action"],
    metadata: p.metadata as Record<string, unknown> | null,
    createdAt: p.createdAt.toISOString(),
  };
}
