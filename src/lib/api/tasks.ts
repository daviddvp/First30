import { api } from "./client";
import type { Task } from "@/types";

export interface TaskQuery { status?: string; priority?: string; assignedTo?: string; }
export const tasksApi = {
  list: (q: TaskQuery = {}) => {
    const p = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => { if (v) p.set(k, String(v)); });
    const qs = p.toString();
    return api.get<Task[]>(`/tasks${qs ? `?${qs}` : ""}`);
  },
  complete: (id: string, completed = true) => api.post<Task>(`/tasks/${id}/complete`, { completed }),
};
