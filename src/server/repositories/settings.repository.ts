import { store, nowISO } from "@/data/store";
import { orgScope, getOrganization } from "@/data/mock-db";
import type { ID, OnboardingRule, Organization, OnboardingRuleType } from "@/types";

export const settingsRepository = {
  organization(orgId: ID): Organization | undefined {
    return getOrganization(orgId);
  },
  updateOrganization(orgId: ID, patch: Partial<Organization>): Organization | undefined {
    const o = store.organizations.find((x) => x.id === orgId);
    if (!o) return undefined;
    Object.assign(o, patch, { updatedAt: nowISO() });
    return o;
  },
  rules(orgId: ID): OnboardingRule[] {
    return orgScope(orgId).onboardingRules();
  },
  updateRule(orgId: ID, type: OnboardingRuleType, patch: Partial<OnboardingRule>): OnboardingRule | undefined {
    const r = store.onboardingRules.find((x) => x.organizationId === orgId && x.type === type);
    if (!r) return undefined;
    Object.assign(r, patch, { updatedAt: nowISO() });
    return r;
  },
};
