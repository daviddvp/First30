import { z } from "zod";

export const alertListQuerySchema = z.object({
  riskLevel: z.enum(["high", "medium", "low"]).optional(),
  status: z.enum(["open", "snoozed", "resolved"]).optional(),
  memberId: z.string().optional(),
});

export const resolveAlertSchema = z.object({
  note: z.string().max(500).optional(),
});

export const snoozeAlertSchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(3),
});
