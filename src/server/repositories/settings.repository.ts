import { prisma } from "@/lib/db";
import type { ID, OnboardingRule, OnboardingRuleType } from "@/types";

export interface OrgSettingsData {
  organizationId: string;
  riskNoReturnDays: number;
  riskLowAttendanceDays: number;
  riskLowAttendanceMin: number;
  notificationsEnabled: boolean;
  reminderDays: number[];
  timezone: string;
}

export const settingsRepository = {
  async getOrgSettings(orgId: ID): Promise<OrgSettingsData | undefined> {
    const row = await prisma.orgSettings.findUnique({
      where: { organizationId: orgId },
    });
    if (!row) return undefined;
    return {
      organizationId: row.organizationId,
      riskNoReturnDays: row.riskNoReturnDays,
      riskLowAttendanceDays: row.riskLowAttendanceDays,
      riskLowAttendanceMin: row.riskLowAttendanceMin,
      notificationsEnabled: row.notificationsEnabled,
      reminderDays: row.reminderDays,
      timezone: row.timezone,
    };
  },

  async upsertOrgSettings(orgId: ID, patch: Partial<Omit<OrgSettingsData, "organizationId">>): Promise<OrgSettingsData> {
    const row = await prisma.orgSettings.upsert({
      where: { organizationId: orgId },
      create: {
        organizationId: orgId,
        riskNoReturnDays: patch.riskNoReturnDays ?? 7,
        riskLowAttendanceDays: patch.riskLowAttendanceDays ?? 14,
        riskLowAttendanceMin: patch.riskLowAttendanceMin ?? 2,
        notificationsEnabled: patch.notificationsEnabled ?? true,
        reminderDays: patch.reminderDays ?? [7, 14, 21, 30],
        timezone: patch.timezone ?? "Europe/Madrid",
      },
      update: {
        ...(patch.riskNoReturnDays      !== undefined && { riskNoReturnDays: patch.riskNoReturnDays }),
        ...(patch.riskLowAttendanceDays !== undefined && { riskLowAttendanceDays: patch.riskLowAttendanceDays }),
        ...(patch.riskLowAttendanceMin  !== undefined && { riskLowAttendanceMin: patch.riskLowAttendanceMin }),
        ...(patch.notificationsEnabled  !== undefined && { notificationsEnabled: patch.notificationsEnabled }),
        ...(patch.reminderDays          !== undefined && { reminderDays: patch.reminderDays }),
        ...(patch.timezone              !== undefined && { timezone: patch.timezone }),
      },
    });
    return {
      organizationId: row.organizationId,
      riskNoReturnDays: row.riskNoReturnDays,
      riskLowAttendanceDays: row.riskLowAttendanceDays,
      riskLowAttendanceMin: row.riskLowAttendanceMin,
      notificationsEnabled: row.notificationsEnabled,
      reminderDays: row.reminderDays,
      timezone: row.timezone,
    };
  },

  async rules(orgId: ID): Promise<OnboardingRule[]> {
    const rows = await prisma.onboardingRule.findMany({
      where: { organizationId: orgId },
      orderBy: { type: "asc" },
    });
    return rows.map(toRule);
  },

  async updateRule(orgId: ID, type: OnboardingRuleType, patch: Partial<OnboardingRule>): Promise<OnboardingRule | undefined> {
    const exists = await prisma.onboardingRule.findFirst({ where: { organizationId: orgId, type } });
    if (!exists) return undefined;
    const row = await prisma.onboardingRule.update({
      where: { organizationId_type: { organizationId: orgId, type } },
      data: {
        ...(patch.enabled        !== undefined && { enabled: patch.enabled }),
        ...(patch.thresholdValue !== undefined && { thresholdValue: patch.thresholdValue }),
        ...(patch.action         !== undefined && { action: patch.action }),
      },
    });
    return toRule(row);
  },
};

function toRule(p: {
  id: string; organizationId: string; type: string; enabled: boolean;
  thresholdValue: number | null; action: string | null; createdAt: Date; updatedAt: Date;
}): OnboardingRule {
  return {
    id: p.id, organizationId: p.organizationId,
    type: p.type as OnboardingRuleType, enabled: p.enabled,
    thresholdValue: p.thresholdValue ?? 0, action: p.action ?? "",
    createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
  };
}
