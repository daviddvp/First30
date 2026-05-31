import { store, nowISO } from "@/data/store";
import { orgScope } from "@/data/mock-db";
import type { ID, RiskAlert, RiskLevel, AlertStatus } from "@/types";

export interface AlertFilters {
  riskLevel?: RiskLevel;
  status?: AlertStatus;
  memberId?: ID;
}

const ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };

export const alertRepository = {
  list(orgId: ID, f: AlertFilters = {}): RiskAlert[] {
    let rows = orgScope(orgId).alerts();
    if (f.riskLevel) rows = rows.filter((a) => a.riskLevel === f.riskLevel);
    if (f.status) rows = rows.filter((a) => a.status === f.status);
    if (f.memberId) rows = rows.filter((a) => a.memberId === f.memberId);
    return rows.sort((a, b) => ORDER[a.riskLevel] - ORDER[b.riskLevel]);
  },
  findById(orgId: ID, id: ID): RiskAlert | undefined {
    return orgScope(orgId).alerts().find((a) => a.id === id);
  },
  update(orgId: ID, id: ID, patch: Partial<RiskAlert>): RiskAlert | undefined {
    const a = store.alerts.find((x) => x.id === id && x.organizationId === orgId);
    if (!a) return undefined;
    Object.assign(a, patch, { updatedAt: nowISO() });
    return a;
  },
};
