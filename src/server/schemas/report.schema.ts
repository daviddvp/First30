import { z } from "zod";

export const generateReportSchema = z.object({
  weekStart: z.string().datetime().optional(),
});
