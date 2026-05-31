import { alertRepository, type AlertFilters } from "../repositories/alert.repository";
import { auditRepository } from "../repositories/audit.repository";
import { nowISO } from "@/data/store";
import { addDays } from "@/lib/date";
import { NotFoundError, RuleViolationError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import { scopedView } from "@/lib/tenant-scope";
import type { RequestContext } from "@/lib/auth";
import type { ID, RiskAlert } from "@/types";

export const alertService = {
  list(ctx: RequestContext, filters: AlertFilters): RiskAlert[] {
    assertCan(ctx.user, "alert.read");
    let rows = scopedView(ctx).visibleAlerts();   // ya filtradas por org + rol
    if (filters.riskLevel) rows = rows.filter((a) => a.riskLevel === filters.riskLevel);
    if (filters.status) rows = rows.filter((a) => a.status === filters.status);
    if (filters.memberId) rows = rows.filter((a) => a.memberId === filters.memberId);
    const order = { high: 0, medium: 1, low: 2 } as const;
    return rows.sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);
  },

  resolve(ctx: RequestContext, id: ID, note?: string): RiskAlert {
    assertCan(ctx.user, "alert.resolve");
    const alert = alertRepository.findById(ctx.organizationId, id);
    if (!alert) throw new NotFoundError("Alerta");
    if (alert.status === "resolved") throw new RuleViolationError("La alerta ya está resuelta");
    const updated = alertRepository.update(ctx.organizationId, id, { status: "resolved", resolvedAt: nowISO() })!;
    auditRepository.record(ctx.organizationId, ctx.user.id, "RiskAlert", id, "resolved_alert", note ? { note } : undefined);
    return updated;
  },

  snooze(ctx: RequestContext, id: ID, days: number): RiskAlert {
    assertCan(ctx.user, "alert.resolve");
    const alert = alertRepository.findById(ctx.organizationId, id);
    if (!alert) throw new NotFoundError("Alerta");
    if (alert.status === "resolved") throw new RuleViolationError("No se puede posponer una alerta resuelta");
    const until = addDays(new Date(nowISO()), days).toISOString();
    const updated = alertRepository.update(ctx.organizationId, id, { status: "snoozed" })!;
    auditRepository.record(ctx.organizationId, ctx.user.id, "RiskAlert", id, "updated", { snoozedUntil: until });
    return updated;
  },
};
