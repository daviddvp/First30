import { reportRepository } from "../repositories/report.repository";
import { auditRepository } from "../repositories/audit.repository";
import { orgScope } from "@/data/mock-db";
import { startOfWeek, endOfWeek, toISO } from "@/lib/date";
import { assertCan } from "@/lib/permissions";
import { scopedView } from "@/lib/tenant-scope";
import { buildAdvancedReport, type AdvancedReport, type ReportInput } from "@/lib/report-engine";
import type { RequestContext } from "@/lib/auth";
import type { ID, WeeklyReport } from "@/types";

/** Reúne la entrada del motor desde los repos scoped por organización. */
function gatherInput(orgId: ID, previous?: WeeklyReport): ReportInput {
  const scope = orgScope(orgId);
  return {
    organizationId: orgId,
    members: scope.members(),
    tasks: scope.tasks(),
    alerts: scope.alerts(),
    coaches: scope.coachProfiles(),
    users: scope.users(),
    previous: previous?.metricsJson ?? null,
  };
}

export const reportService = {
  list(ctx: RequestContext): WeeklyReport[] {
    assertCan(ctx.user, "report.read");
    return reportRepository.list(ctx.organizationId);
  },
  latest(ctx: RequestContext): WeeklyReport | undefined {
    assertCan(ctx.user, "report.read");
    return reportRepository.latest(ctx.organizationId);
  },

  /** Informe avanzado completo (owner/manager). */
  advanced(ctx: RequestContext): AdvancedReport {
    assertCan(ctx.user, "report.read");
    const history = reportRepository.list(ctx.organizationId);
    return buildAdvancedReport(gatherInput(ctx.organizationId, history[1]));
  },

  /** Resumen operativo limitado a los socios del coach (si tiene report.read). */
  coachDigest(ctx: RequestContext): AdvancedReport {
    assertCan(ctx.user, "report.read");
    const view = scopedView(ctx);
    const orgId = ctx.organizationId;
    const scope = orgScope(orgId);
    const mine = view.visibleMembers();
    const myIds = new Set(mine.map((m) => m.id));
    return buildAdvancedReport({
      organizationId: orgId,
      members: mine,
      tasks: view.visibleTasks(),
      alerts: scope.alerts().filter((a) => myIds.has(a.memberId)),
      coaches: scope.coachProfiles().filter((c) => c.id === ctx.user.coachProfileId),
      users: scope.users(),
      previous: null,
    });
  },

  generate(ctx: RequestContext): WeeklyReport {
    assertCan(ctx.user, "report.generate");
    const history = reportRepository.list(ctx.organizationId);
    const adv = buildAdvancedReport(gatherInput(ctx.organizationId, history[0]));
    const report = reportRepository.create(ctx.organizationId, {
      weekStart: toISO(startOfWeek()), weekEnd: toISO(endOfWeek()),
      metricsJson: adv.metrics, summary: adv.executiveSummary,
    });
    auditRepository.record(ctx.organizationId, ctx.user.id, "WeeklyReport", report.id, "generated_report");
    return report;
  },

  latestRaw(orgId: ID): WeeklyReport | undefined {
    return reportRepository.latest(orgId);
  },
};
