import { prisma } from "@/lib/db";
import type { ID, WeeklyReport, WeeklyMetrics } from "@/types";

export const reportRepository = {
  async list(orgId: ID): Promise<WeeklyReport[]> {
    const rows = await prisma.weeklyReport.findMany({
      where: { organizationId: orgId },
      orderBy: { weekStart: "desc" },
    });
    return rows.map(toReport);
  },

  async latest(orgId: ID): Promise<WeeklyReport | undefined> {
    const row = await prisma.weeklyReport.findFirst({
      where: { organizationId: orgId },
      orderBy: { weekStart: "desc" },
    });
    return row ? toReport(row) : undefined;
  },

  async create(
    orgId: ID,
    data: Omit<WeeklyReport, "id" | "organizationId" | "createdAt">,
  ): Promise<WeeklyReport> {
    const row = await prisma.weeklyReport.create({
      data: {
        organizationId: orgId,
        weekStart: new Date(data.weekStart),
        weekEnd: new Date(data.weekEnd),
        metricsJson: data.metricsJson as object,
        summary: data.summary ?? null,
      },
    });
    return toReport(row);
  },
};

function toReport(p: {
  id: string; organizationId: string; weekStart: Date; weekEnd: Date;
  metricsJson: unknown; summary: string | null; createdAt: Date;
}): WeeklyReport {
  return {
    id: p.id, organizationId: p.organizationId,
    weekStart: p.weekStart.toISOString(), weekEnd: p.weekEnd.toISOString(),
    metricsJson: p.metricsJson as WeeklyMetrics,
    summary: p.summary ?? "",
    createdAt: p.createdAt.toISOString(),
  };
}
