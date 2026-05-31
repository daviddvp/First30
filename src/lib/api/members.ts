import { api } from "./client";
import type { Member } from "@/types";

export interface MemberQuery {
  status?: string; riskLevel?: string; coachId?: string; search?: string;
  onboardingMin?: number; onboardingMax?: number;
}

export const membersApi = {
  list: (q: MemberQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v !== undefined && v !== "") params.set(k, String(v)); });
    const qs = params.toString();
    return api.get<Member[]>(`/members${qs ? `?${qs}` : ""}`);
  },
  get: (id: string) => api.get<Member>(`/members/${id}`),
  assignCoach: (id: string, coachId: string) => api.post<Member>(`/members/${id}/assign-coach`, { coachId }),
  markContacted: (id: string) => api.post<Member>(`/members/${id}/mark-contacted`),
};
