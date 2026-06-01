import { taskRepository, type TaskFilters } from "../repositories/task.repository";
import { auditRepository } from "../repositories/audit.repository";
import { NotFoundError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import { getVisibilityFilters } from "@/lib/tenant-scope";
import { trackServerEvent } from "@/lib/analytics";
import type { RequestContext } from "@/lib/auth";
import type { ID, Task } from "@/types";
import type { CreateTaskInput } from "../schemas/task.schema";

export const taskService = {
  async list(ctx: RequestContext, filters: TaskFilters): Promise<Task[]> {
    assertCan(ctx.user, "task.read");
    const vis = getVisibilityFilters(ctx);
    return taskRepository.list(ctx.organizationId, {
      ...filters,
      // Coach solo ve tareas asignadas a él
      ...(vis.assignedToUserId && { forUserId: vis.assignedToUserId }),
    });
  },

  async create(ctx: RequestContext, input: CreateTaskInput): Promise<Task> {
    assertCan(ctx.user, "task.create");
    const task = await taskRepository.create(ctx.organizationId, {
      title: input.title, description: input.description ?? null,
      memberId: input.memberId ?? null, assignedToUserId: input.assignedToUserId,
      priority: input.priority, status: input.status,
      dueDate: input.dueDate ?? null, completedAt: null, ruleKey: null,
    });
    await auditRepository.record(ctx.organizationId, ctx.user.id, "Task", task.id, "created");
    return task;
  },

  async update(ctx: RequestContext, id: ID, patch: Partial<Task>): Promise<Task> {
    assertCan(ctx.user, "task.create");
    const updated = await taskRepository.update(ctx.organizationId, id, patch);
    if (!updated) throw new NotFoundError("Tarea");
    await auditRepository.record(ctx.organizationId, ctx.user.id, "Task", id, "updated", patch as Record<string, unknown>);
    return updated;
  },

  async setCompleted(ctx: RequestContext, id: ID, completed: boolean): Promise<Task> {
    const task = await taskRepository.findById(ctx.organizationId, id);
    if (!task) throw new NotFoundError("Tarea");
    assertCan(ctx.user, "task.complete", { assignedToUserId: task.assignedToUserId });
    const updated = await taskRepository.update(ctx.organizationId, id, {
      status: completed ? "completed" : "pending",
      completedAt: completed ? new Date().toISOString() : null,
    });
    if (!updated) throw new NotFoundError("Tarea");
    await auditRepository.record(ctx.organizationId, ctx.user.id, "Task", id, "completed_task", { completed });
    if (completed) trackServerEvent("task_completed", ctx, { taskId: id, memberId: task.memberId ?? undefined, priority: task.priority });
    return updated;
  },
};
