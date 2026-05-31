import { z } from "zod";

export const updateSettingsSchema = z.object({
  name: z.string().min(2).optional(),
  timezone: z.string().optional(),
  brandingColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color hex no válido").optional(),
}).strict();

export const riskRuleSchema = z.object({
  type: z.enum(["no_return_7d", "low_attendance_14d", "no_coach", "checkin_no_response"]),
  enabled: z.boolean().optional(),
  thresholdValue: z.coerce.number().int().min(0).max(60).optional(),
});

export const updateRiskRulesSchema = z.object({
  rules: z.array(riskRuleSchema).min(1, "Envía al menos una regla"),
});
