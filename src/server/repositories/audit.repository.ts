import { store, genId, nowISO } from "@/data/store";
import type { ID, AuditLog, AuditAction } from "@/types";

export const auditRepository = {
  record(orgId: ID, actorUserId: ID, entityType: string, entityId: ID, action: AuditAction, metadata?: Record<string, unknown>): AuditLog {
    const log: AuditLog = {
      id: genId("aud"), organizationId: orgId, actorUserId, entityType, entityId,
      action, metadata: metadata ?? null, createdAt: nowISO(),
    };
    store.auditLogs.push(log);
    return log;
  },
};
