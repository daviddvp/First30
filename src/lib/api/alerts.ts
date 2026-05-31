import { api } from "./client";
import type { RiskAlert } from "@/types";

export interface AlertQuery { riskLevel?: string; status?: string; }
export const alertsApi = {
  list: (q: AlertQuery = {}) => {
    const p = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    const qs = p.toString();
    return api.get<RiskAlert[]>(`/alerts${qs ? `?${qs}` : ""}`);
  },
  resolve: (id: string) => api.post<RiskAlert>(`/alerts/${id}/resolve`, {}),
  snooze: (id: string, days = 3) => api.post<RiskAlert>(`/alerts/${id}/snooze`, { days }),
};
