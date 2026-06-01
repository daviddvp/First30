import { settingsRepository } from "../repositories/settings.repository";
import { auditRepository } from "../repositories/audit.repository";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import type { RequestContext } from "@/lib/auth";
import type { OnboardingRule, OnboardingRuleType } from "@/types";
import type { z } from "zod";
import type { updateSettingsSchema, riskRuleSchema } from "../schemas/settings.schema";

export interface SettingsView {
  orgSettings: import("../repositories/settings.repository").OrgSettingsData;
  rules: OnboardingRule[];
}

export const settingsService = {
  async get(ctx: RequestContext): Promise<SettingsView> {
    assertCan(ctx.user, "settings.read");
    const [orgSettings, rules] = await Promise.all([
      settingsRepository.getOrgSettings(ctx.organizationId),
      settingsRepository.rules(ctx.organizationId),
    ]);
    const org = await prisma.organization.findUnique({ where: { id: ctx.organizationId } });
    if (!org) throw new NotFoundError("Organización");
    const settings = orgSettings ?? {
      organizationId: ctx.organizationId,
      riskNoReturnDays: 7, riskLowAttendanceDays: 14, riskLowAttendanceMin: 2,
      notificationsEnabled: true, reminderDays: [7, 14, 21, 30], timezone: org.timezone,
    };
    return { orgSettings: settings, rules };
  },

  async update(ctx: RequestContext, patch: z.infer<typeof updateSettingsSchema>): Promise<import("../repositories/settings.repository").OrgSettingsData> {
    assertCan(ctx.user, "settings.update");
    const org = await prisma.organization.findUnique({ where: { id: ctx.organizationId } });
    if (!org) throw new NotFoundError("Organización");
    const updated = await settingsRepository.upsertOrgSettings(ctx.organizationId, patch);
    await auditRepository.record(ctx.organizationId, ctx.user.id, "OrgSettings", ctx.organizationId, "updated", patch as Record<string, unknown>);
    return updated;
  },

  async updateRules(ctx: RequestContext, rules: z.infer<typeof riskRuleSchema>[]): Promise<OnboardingRule[]> {
    assertCan(ctx.user, "settings.update");
    const result: OnboardingRule[] = [];
    for (const r of rules) {
      const updated = await settingsRepository.updateRule(ctx.organizationId, r.type as OnboardingRuleType, {
        enabled: r.enabled, thresholdValue: r.thresholdValue,
      });
      if (updated) result.push(updated);
    }
    await auditRepository.record(ctx.organizationId, ctx.user.id, "OnboardingRule", ctx.organizationId, "updated", { count: result.length });
    return result;
  },
};
