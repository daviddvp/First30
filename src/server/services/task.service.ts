import { taskRepository, type TaskFilters } from "../repositories/task.repository";
import { auditRepository } from "../repositories/audit.repository";
import { nowISO } from "@/data/store";
import { NotFoundError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import { scopedView } from "@/lib/tenant-scope";
import type { RequestContext } from "@/lib/auth";
import type { ID, Task } from "@/types";
import type { CreateTaskInput } from "../schemas/task.schema";

export const taskService = {
  list(ctx: RequestContext, filters: TaskFilters): Task[] {
    assertCan(ctx.user, "task.read");
    let rows = scopedView(ctx).visibleTasks();
    if (filters.status) rows = rows.filter((t) => t.status === filters.status);
    if (filters.priority) rows = rows.filter((t) => t.priority === filters.priority);
    if (filters.assignedTo) rows = rows.filter((t) => t.assignedToUserId === filters.assignedTo);
    if (filters.memberId) rows = rows.filter((t) => t.memberId === filters.memberId);
    return rows;
  },

  create(ctx: RequestContext, input: CreateTaskInput): Task {
    assertCan(ctx.user, "task.create");
    // Coherencia multi-tenant: la tarea SIEMPRE se crea con la org del contexto.
    const task = taskRepository.create(ctx.organizationId, {
      title: input.title, description: input.description ?? null, memberId: input.memberId ?? null,
      assignedToUserId: input.assignedToUserId, priority: input.priority, status: input.status,
      dueDate: input.dueDate ?? null, completedAt: null,
    });
    auditRepository.record(ctx.organizationId, ctx.user.id, "Task", task.id, "created");
    return task;
  },

  update(ctx: RequestContext, id: ID, patch: Partial<Task>): Task {
    assertCan(ctx.user, "task.create"); // editar requiere permiso de gestión de tareas
    const updated = taskRepository.update(ctx.organizationId, id, patch);
    if (!updated) throw new NotFoundError("Tarea");
    auditRepository.record(ctx.organizationId, ctx.user.id, "Task", id, "updated", patch);
    return updated;
  },

  setCompleted(ctx: RequestContext, id: ID, completed: boolean): Task {
    const task = taskRepository.findById(ctx.organizationId, id);
    if (!task) throw new NotFoundError("Tarea");
    // El coach solo completa tareas asignadas a él (ownership).
    assertCan(ctx.user, "task.complete", { assignedToUserId: task.assignedToUserId });
    const updated = taskRepository.update(ctx.organizationId, id, {
      status: completed ? "completed" : "pending",
      completedAt: completed ? nowISO() : null,
    })!;
    auditRepository.record(ctx.organizationId, ctx.user.id, "Task", id, "completed_task", { completed });
    return updated;
  },
};
