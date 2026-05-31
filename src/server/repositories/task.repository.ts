import { store, genId, nowISO } from "@/data/store";
import { orgScope } from "@/data/mock-db";
import type { ID, Task, TaskStatus, Priority } from "@/types";

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  assignedTo?: ID;
  memberId?: ID;
}

export const taskRepository = {
  list(orgId: ID, f: TaskFilters = {}): Task[] {
    let rows = orgScope(orgId).tasks();
    if (f.status) rows = rows.filter((t) => t.status === f.status);
    if (f.priority) rows = rows.filter((t) => t.priority === f.priority);
    if (f.assignedTo) rows = rows.filter((t) => t.assignedToUserId === f.assignedTo);
    if (f.memberId) rows = rows.filter((t) => t.memberId === f.memberId);
    return rows;
  },
  findById(orgId: ID, id: ID): Task | undefined {
    return orgScope(orgId).tasks().find((t) => t.id === id);
  },
  create(orgId: ID, data: Omit<Task, "id" | "organizationId" | "createdAt" | "updatedAt">): Task {
    const task: Task = {
      ...data, id: genId("tsk"), organizationId: orgId,
      createdAt: nowISO(), updatedAt: nowISO(),
    };
    store.tasks.push(task);
    return task;
  },
  update(orgId: ID, id: ID, patch: Partial<Task>): Task | undefined {
    const t = store.tasks.find((x) => x.id === id && x.organizationId === orgId);
    if (!t) return undefined;
    Object.assign(t, patch, { updatedAt: nowISO() });
    return t;
  },
};
