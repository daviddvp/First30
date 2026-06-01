import { alertRepository, type AlertFilters } from "../repositories/alert.repository";
import { auditRepository } from "../repositories/audit.repository";
import { addDays } from "@/lib/date";
import { NotFoundError, RuleViolationError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import { getVisibilityFilters } from "@/lib/tenant-scope";
import { trackServerEvent } from "@/lib/analytics";
import type { RequestContext } from "@/lib/auth";
import type { ID, RiskAlert } from "@/types";

export const alertService = {
  async list(ctx: RequestContext, filters: AlertFilters): Promise<RiskAlert[]> {
    assertCan(ctx.user, "alert.read");
    const vis = getVisibilityFilters(ctx);
    return alertRepository.list(ctx.organizationId, {
      ...filters,
      // Coach solo ve alertas de sus socios
      ...(vis.coachId && { forCoachId: vis.coachId }),
    });
  },

  async resolve(ctx: RequestContext, id: ID, note?: string): Promise<RiskAlert> {
    assertCan(ctx.user, "alert.resolve");
    const alert = await alertRepository.findById(ctx.organizationId, id);
    if (!alert) throw new NotFoundError("Alerta");
    if (alert.status === "resolved") throw new RuleViolationError("La alerta ya está resuelta");
    const updated = await alertRepository.update(ctx.organizationId, id, {
      status: "resolved",
      resolvedAt: new Date().toISOString(),
      resolvedNote: note ?? null,
    });
    if (!updated) throw new NotFoundError("Alerta");
    await auditRepository.record(ctx.organizationId, ctx.user.id, "RiskAlert", id, "resolved_alert", note ? { note } : undefined);
    trackServerEvent("risk_alert_resolved", ctx, { alertId: id, riskLevel: alert.riskLevel, reason: alert.reason });
    return updated;
  },

  async snooze(ctx: RequestContext, id: ID, days: number): Promise<RiskAlert> {
    assertCan(ctx.user, "alert.resolve");
    const alert = await alertRepository.findById(ctx.organizationId, id);
    if (!alert) throw new NotFoundError("Alerta");
    if (alert.status === "resolved") throw new RuleViolationError("No se puede posponer una alerta resuelta");
    const until = addDays(new Date(), days).toISOString();
    const updated = await alertRepository.update(ctx.organizationId, id, {
      status: "snoozed", snoozeUntil: until,
    });
    if (!updated) throw new NotFoundError("Alerta");
    await auditRepository.record(ctx.organizationId, ctx.user.id, "RiskAlert", id, "updated", { snoozedUntil: until });
    return updated;
  },
};
