import { z } from "zod";

export const memberStatus = z.enum(["in_progress", "at_risk", "activated", "no_coach", "completed", "churned"]);
export const riskLevel = z.enum(["high", "medium", "low"]);
export const memberLevel = z.enum(["beginner", "intermediate", "advanced"]);

export const createMemberSchema = z.object({
  fullName: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Email no válido"),
  phone: z.string().min(6).optional().default("+34 6XX XXX XXX"),
  mainGoal: z.string().min(2, "Indica el objetivo principal"),
  level: memberLevel,
  acquisitionSource: z.string().min(2).default("Web"),
  limitations: z.string().nullable().optional().default(null),
  fears: z.string().nullable().optional().default(null),
  assignedCoachId: z.string().nullable().optional().default(null),
});

export const updateMemberSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(6).optional(),
  mainGoal: z.string().min(2).optional(),
  level: memberLevel.optional(),
  status: memberStatus.optional(),
  riskLevel: riskLevel.optional(),
  limitations: z.string().nullable().optional(),
  fears: z.string().nullable().optional(),
  nextRecommendedAction: z.string().optional(),
}).strict();

export const assignCoachSchema = z.object({
  coachId: z.string().min(1, "Selecciona un coach"),
});

export const memberListQuerySchema = z.object({
  status: memberStatus.optional(),
  riskLevel: riskLevel.optional(),
  coachId: z.string().optional(),
  search: z.string().optional(),
  onboardingMin: z.coerce.number().int().min(0).max(30).optional(),
  onboardingMax: z.coerce.number().int().min(0).max(30).optional(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
