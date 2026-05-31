import { z } from "zod";

export const taskStatus = z.enum(["today", "this_week", "pending", "completed", "cancelled"]);
export const priority = z.enum(["low", "medium", "high"]);

export const createTaskSchema = z.object({
  title: z.string().min(3, "El título es obligatorio"),
  description: z.string().nullable().optional().default(null),
  memberId: z.string().nullable().optional().default(null),
  assignedToUserId: z.string().min(1, "Asigna un responsable"),
  priority: priority.default("medium"),
  status: taskStatus.default("pending"),
  dueDate: z.string().datetime().nullable().optional().default(null),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().nullable().optional(),
  priority: priority.optional(),
  status: taskStatus.optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assignedToUserId: z.string().optional(),
}).strict();

export const completeTaskSchema = z.object({
  completed: z.boolean().default(true),
});

export const taskListQuerySchema = z.object({
  status: taskStatus.optional(),
  priority: priority.optional(),
  assignedTo: z.string().optional(),
  memberId: z.string().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
