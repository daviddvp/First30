import { orgScope } from "@/data/mock-db";
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

/** Lista los eventos de auditoría de la organización con el nombre del actor. */
export const auditService = {
  recent(ctx: RequestContext, limit = 20): AuditEntry[] {
    assertCan(ctx.user, "report.read"); // owner/manager/coach con report.read
    const scope = orgScope(ctx.organizationId);
    const users = scope.users();
    return scope.auditLogs()
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, limit)
      .map((a) => ({
        id: a.id,
        actorName: users.find((u) => u.id === a.actorUserId)?.name ?? "Sistema",
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        metadataSummary: a.metadata ? Object.entries(a.metadata).map(([k, v]) => `${k}: ${v}`).join(", ") : null,
        createdAt: a.createdAt,
      }));
  },
};
