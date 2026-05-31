import { settingsRepository } from "../repositories/settings.repository";
import { auditRepository } from "../repositories/audit.repository";
import { NotFoundError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import type { RequestContext } from "@/lib/auth";
import type { Organization, OnboardingRule, OnboardingRuleType } from "@/types";
import type { z } from "zod";
import type { updateSettingsSchema, riskRuleSchema } from "../schemas/settings.schema";

export interface SettingsView {
  organization: Organization;
  rules: OnboardingRule[];
}

export const settingsService = {
  get(ctx: RequestContext): SettingsView {
    assertCan(ctx.user, "settings.read");
    const organization = settingsRepository.organization(ctx.organizationId);
    if (!organization) throw new NotFoundError("Organización");
    return { organization, rules: settingsRepository.rules(ctx.organizationId) };
  },

  update(ctx: RequestContext, patch: z.infer<typeof updateSettingsSchema>): Organization {
    assertCan(ctx.user, "settings.update"); // solo owner
    const updated = settingsRepository.updateOrganization(ctx.organizationId, patch);
    if (!updated) throw new NotFoundError("Organización");
    auditRepository.record(ctx.organizationId, ctx.user.id, "Organization", ctx.organizationId, "updated", patch);
    return updated;
  },

  updateRules(ctx: RequestContext, rules: z.infer<typeof riskRuleSchema>[]): OnboardingRule[] {
    assertCan(ctx.user, "settings.update"); // solo owner
    const result: OnboardingRule[] = [];
    for (const r of rules) {
      const updated = settingsRepository.updateRule(ctx.organizationId, r.type as OnboardingRuleType, {
        enabled: r.enabled, thresholdValue: r.thresholdValue,
      });
      if (updated) result.push(updated);
    }
    auditRepository.record(ctx.organizationId, ctx.user.id, "OnboardingRule", ctx.organizationId, "updated", { count: result.length });
    return result;
  },
};
