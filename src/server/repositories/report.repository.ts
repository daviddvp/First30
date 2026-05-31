import { store, genId, nowISO } from "@/data/store";
import { orgScope } from "@/data/mock-db";
import type { ID, WeeklyReport } from "@/types";

export const reportRepository = {
  list(orgId: ID): WeeklyReport[] {
    return orgScope(orgId).weeklyReports()
      .sort((a, b) => +new Date(b.weekStart) - +new Date(a.weekStart));
  },
  latest(orgId: ID): WeeklyReport | undefined {
    return reportRepository.list(orgId)[0];
  },
  create(orgId: ID, data: Omit<WeeklyReport, "id" | "organizationId" | "createdAt">): WeeklyReport {
    const report: WeeklyReport = { ...data, id: genId("rep"), organizationId: orgId, createdAt: nowISO() };
    store.weeklyReports.push(report);
    return report;
  },
};
