import { api } from "./client";

export interface MemberDetailDto {
  insight: {
    score: { score: number; breakdown: { label: string; points: number; applied: boolean }[]; classification: "high" | "medium" | "low"; madeSecondVisit: boolean };
    risk: { findings: { rule: string; riskLevel: "high" | "medium" | "low"; reason: string; suggestedAction: string }[]; topRisk: "high" | "medium" | "low" };
    state: { status: string; source: "auto" | "manual"; reason: string };
    nextAction: { title: string; detail: string; ctaKind: string; templateCategory: string | null };
  };
  coachName: string | null;
  activity: { id: string; kind: string; label: string; date: string }[];
  messages: { id: string; body: string; status: string; channel: string; createdAt: string }[];
  audit: { id: string; action: string; createdAt: string }[];
  scoreHistory: { day: number; score: number }[];
  recommendedClass: string;
  aiSummary: string;
}

export const memberDetailApi = {
  get: (id: string) => api.get<MemberDetailDto>(`/members/${id}/detail`),
  notes: (id: string) => api.get<{ id: string; body: string; createdAt: string }[]>(`/members/${id}/notes`),
};
