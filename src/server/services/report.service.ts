import { reportRepository } from "../repositories/report.repository";
import { memberRepository } from "../repositories/member.repository";
import { taskRepository } from "../repositories/task.repository";
import { alertRepository } from "../repositories/alert.repository";
import { coachRepository } from "../repositories/coach.repository";
import { auditRepository } from "../repositories/audit.repository";
import { prisma } from "@/lib/db";
import { startOfWeek, endOfWeek, toISO } from "@/lib/date";
import { trackServerEvent } from "@/lib/analytics";
import { assertCan } from "@/lib/permissions";
import { getVisibilityFilters } from "@/lib/tenant-scope";
import { buildAdvancedReport, type AdvancedReport, type ReportInput } from "@/lib/report-engine";
import type { RequestContext } from "@/lib/auth";
import type { ID, WeeklyReport } from "@/types";

async function gatherInput(orgId: ID, previous?: WeeklyReport | null): Promise<ReportInput> {
  const [members, tasks, alerts, coaches, users] = await Promise.all([
    memberRepository.list(orgId),
    taskRepository.list(orgId),
    alertRepository.list(orgId),
    coachRepository.list(orgId),
    prisma.user.findMany({ where: { organizationId: orgId } }),
  ]);
  return {
    organizationId: orgId,
    members, tasks, alerts, coaches,
    users: users.map((u) => ({
      id: u.id, organizationId: u.organizationId, name: u.name, email: u.email,
      role: u.role as "owner" | "manager" | "coach",
      avatarUrl: u.avatarUrl, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString(),
    })),
    previous: previous?.metricsJson ?? null,
  };
}

export const reportService = {
  async list(ctx: RequestContext): Promise<WeeklyReport[]> {
    assertCan(ctx.user, "report.read");
    return reportRepository.list(ctx.organizationId);
  },

  async latest(ctx: RequestContext): Promise<WeeklyReport | undefined> {
    assertCan(ctx.user, "report.read");
    return reportRepository.latest(ctx.organizationId);
  },

  async advanced(ctx: RequestContext): Promise<AdvancedReport> {
    assertCan(ctx.user, "report.read");
    const history = await reportRepository.list(ctx.organizationId);
    const input = await gatherInput(ctx.organizationId, history[1] ?? null);
    return buildAdvancedReport(input);
  },

  async coachDigest(ctx: RequestContext): Promise<AdvancedReport> {
    assertCan(ctx.user, "report.read");
    const vis = getVisibilityFilters(ctx);
    const [allMembers, allTasks, allAlerts, coaches] = await Promise.all([
      memberRepository.list(ctx.organizationId, vis.coachId ? { coachId: vis.coachId } : {}),
      taskRepository.list(ctx.organizationId, vis.assignedToUserId ? { forUserId: vis.assignedToUserId } : {}),
      alertRepository.list(ctx.organizationId, vis.coachId ? { forCoachId: vis.coachId } : {}),
      coachRepository.list(ctx.organizationId),
    ]);
    return buildAdvancedReport({
      organizationId: ctx.organizationId,
      members: allMembers, tasks: allTasks, alerts: allAlerts,
      coaches: coaches.filter((c) => !vis.coachId || c.id === ctx.user.coachProfileId),
      users: [], previous: null,
    });
  },

  async generate(ctx: RequestContext): Promise<WeeklyReport> {
    assertCan(ctx.user, "report.generate");
    const history = await reportRepository.list(ctx.organizationId);
    const input = await gatherInput(ctx.organizationId, history[0] ?? null);
    const adv = buildAdvancedReport(input);
    const report = await reportRepository.create(ctx.organizationId, {
      weekStart: toISO(startOfWeek()), weekEnd: toISO(endOfWeek()),
      metricsJson: adv.metrics, summary: adv.executiveSummary,
    });
    await auditRepository.record(ctx.organizationId, ctx.user.id, "WeeklyReport", report.id, "generated_report");
    trackServerEvent("weekly_report_generated", ctx);
    return report;
  },

  async latestRaw(orgId: ID): Promise<WeeklyReport | undefined> {
    return reportRepository.latest(orgId);
  },
};
