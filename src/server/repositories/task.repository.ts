import { prisma } from "@/lib/db";
import type { ID, Task, TaskStatus, Priority } from "@/types";

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  assignedTo?: ID;
  memberId?: ID;
  /** Si se pasa, filtra solo tareas asignadas a este userId (para coach). */
  forUserId?: ID;
  /** Si se pasa, filtra solo tareas de socios de este coachId (para visibilidad coach). */
  forCoachId?: ID;
}

export const taskRepository = {
  async list(orgId: ID, f: TaskFilters = {}): Promise<Task[]> {
    const rows = await prisma.task.findMany({
      where: {
        organizationId: orgId,
        ...(f.status     && { status: f.status }),
        ...(f.priority   && { priority: f.priority }),
        ...(f.assignedTo && { assignedToUserId: f.assignedTo }),
        ...(f.memberId   && { memberId: f.memberId }),
        // Filtro de visibilidad coach: solo tareas asignadas al propio usuario
        ...(f.forUserId  && !f.forCoachId && { assignedToUserId: f.forUserId }),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toTask);
  },

  async findById(orgId: ID, id: ID): Promise<Task | undefined> {
    const row = await prisma.task.findFirst({
      where: { id, organizationId: orgId },
    });
    return row ? toTask(row) : undefined;
  },

  async create(
    orgId: ID,
    data: Omit<Task, "id" | "organizationId" | "createdAt" | "updatedAt">,
  ): Promise<Task> {
    const row = await prisma.task.create({
      data: {
        organizationId: orgId,
        memberId: data.memberId ?? null,
        assignedToUserId: data.assignedToUserId ?? null,
        title: data.title,
        description: data.description ?? null,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        completedAt: data.completedAt ? new Date(data.completedAt) : null,
        ruleKey: data.ruleKey ?? null,
      },
    });
    return toTask(row);
  },

  async update(orgId: ID, id: ID, patch: Partial<Task>): Promise<Task | undefined> {
    const exists = await prisma.task.findFirst({ where: { id, organizationId: orgId }, select: { id: true } });
    if (!exists) return undefined;

    const row = await prisma.task.update({
      where: { id },
      data: {
        ...(patch.title              !== undefined && { title: patch.title }),
        ...(patch.description        !== undefined && { description: patch.description }),
        ...(patch.status             !== undefined && { status: patch.status }),
        ...(patch.priority           !== undefined && { priority: patch.priority }),
        ...(patch.assignedToUserId   !== undefined && { assignedToUserId: patch.assignedToUserId }),
        ...(patch.dueDate            !== undefined && { dueDate: patch.dueDate ? new Date(patch.dueDate) : null }),
        ...(patch.completedAt        !== undefined && { completedAt: patch.completedAt ? new Date(patch.completedAt) : null }),
      },
    });
    return toTask(row);
  },

  /** Busca una tarea abierta por ruleKey (para deduplicación del job). */
  async findOpenByRuleKey(orgId: ID, ruleKey: string): Promise<Task | undefined> {
    const row = await prisma.task.findFirst({
      where: {
        organizationId: orgId,
        ruleKey,
        status: { in: ["today", "this_week", "pending"] },
      },
    });
    return row ? toTask(row) : undefined;
  },
};

function toTask(p: {
  id: string; organizationId: string; memberId: string | null;
  assignedToUserId: string | null; title: string; description: string | null;
  priority: string; status: string; dueDate: Date | null; completedAt: Date | null;
  ruleKey: string | null; createdAt: Date; updatedAt: Date;
}): Task {
  return {
    id: p.id, organizationId: p.organizationId, memberId: p.memberId,
    assignedToUserId: p.assignedToUserId,
    title: p.title, description: p.description,
    priority: p.priority as Task["priority"], status: p.status as Task["status"],
    dueDate: p.dueDate?.toISOString() ?? null,
    completedAt: p.completedAt?.toISOString() ?? null,
    ruleKey: p.ruleKey,
    createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
  };
}
