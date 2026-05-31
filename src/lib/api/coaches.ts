import { api } from "./client";

export interface CoachView {
  id: string; userName: string | null; memberCount: number;
  atRiskCount: number; load: number; specialties: string[];
}
export const coachesApi = {
  list: () => api.get<CoachView[]>("/coaches"),
};
