import { z } from "zod";

export const coachListQuerySchema = z.object({
  active: z.coerce.boolean().optional(),
});
