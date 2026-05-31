import { store, genId, nowISO } from "@/data/store";
import { orgScope } from "@/data/mock-db";
import type { ID, Member, MemberStatus, RiskLevel } from "@/types";

export interface MemberFilters {
  status?: MemberStatus;
  riskLevel?: RiskLevel;
  coachId?: ID;
  search?: string;
  onboardingMin?: number;
  onboardingMax?: number;
}

export const memberRepository = {
  list(orgId: ID, f: MemberFilters = {}): Member[] {
    let rows = orgScope(orgId).members();
    if (f.status) rows = rows.filter((m) => m.status === f.status);
    if (f.riskLevel) rows = rows.filter((m) => m.riskLevel === f.riskLevel);
    if (f.coachId) rows = rows.filter((m) => m.assignedCoachId === f.coachId);
    if (f.onboardingMin != null) rows = rows.filter((m) => m.onboardingDay >= f.onboardingMin!);
    if (f.onboardingMax != null) rows = rows.filter((m) => m.onboardingDay <= f.onboardingMax!);
    if (f.search) {
      const q = f.search.toLowerCase();
      rows = rows.filter((m) => m.fullName.toLowerCase().includes(q) || m.mainGoal.toLowerCase().includes(q));
    }
    return rows.sort((a, b) => a.onboardingDay - b.onboardingDay);
  },

  findById(orgId: ID, id: ID): Member | undefined {
    return orgScope(orgId).member(id);
  },

  create(orgId: ID, data: Omit<Member, "id" | "organizationId" | "createdAt" | "updatedAt">): Member {
    const member: Member = {
      ...data, id: genId("mbr"), organizationId: orgId,
      createdAt: nowISO(), updatedAt: nowISO(),
    };
    store.members.push(member);
    return member;
  },

  update(orgId: ID, id: ID, patch: Partial<Member>): Member | undefined {
    const m = store.members.find((x) => x.id === id && x.organizationId === orgId);
    if (!m) return undefined;
    Object.assign(m, patch, { updatedAt: nowISO() });
    return m;
  },
};
