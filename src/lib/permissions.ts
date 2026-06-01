/* Capa de permisos (RBAC). Define las acciones, la matriz por rol y la función
   can(user, action, resource). Es pura: no hace queries ni toca la request.
   El aislamiento por organización se garantiza aparte (tenant-scope); aquí solo
   se decide si un rol puede ejecutar una acción, con matices a nivel de recurso. */
import type { CurrentUser } from "./auth";
import type { UserRole, ID } from "../types";

export type Action =
  | "member.read" | "member.create" | "member.update" | "member.assignCoach" | "member.import"
  | "task.read" | "task.create" | "task.complete"
  | "alert.read" | "alert.resolve"
  | "settings.read" | "settings.update"
  | "report.read" | "report.generate"
  | "message.use"
  | "coach.create";

/** Recurso opcional para decisiones contextuales (p. ej. ownership de coach). */
export interface ResourceRef {
  /** CoachProfile.id del coach dueño del recurso (socio/tarea/mensaje). */
  ownerCoachId?: ID | null;
  /** User.id asignado (para tareas asignadas a un usuario). */
  assignedToUserId?: ID | null;
}

/** Matriz base de permisos por rol (sin matices de ownership). */
const MATRIX: Record<UserRole, Set<Action>> = {
  owner: new Set<Action>([
    "member.read", "member.create", "member.update", "member.assignCoach", "member.import",
    "task.read", "task.create", "task.complete",
    "alert.read", "alert.resolve",
    "settings.read", "settings.update",
    "report.read", "report.generate",
    "message.use", "coach.create",
  ]),
  manager: new Set<Action>([
    "member.read", "member.create", "member.update", "member.assignCoach", "member.import",
    "task.read", "task.create", "task.complete",
    "alert.read", "alert.resolve",
    "settings.read",                  // puede ver, NO settings.update (config crítica/billing)
    "report.read", "report.generate",
    "message.use",
  ]),
  coach: new Set<Action>([
    "member.read",                    // solo SUS socios (se valida con resource)
    "task.read", "task.complete",     // solo sus tareas
    "alert.read",
    "report.read",                    // limitado (no ejecutivos globales) — ver nota
    "message.use",                    // solo de sus socios
  ]),
};

/** Acciones que para un coach requieren ser dueño del recurso. */
const COACH_OWNERSHIP_REQUIRED: Set<Action> = new Set<Action>([
  "member.read", "member.update", "task.complete", "message.use",
]);

/**
 * Decide si `user` puede ejecutar `action` sobre `resource`.
 * - Comprueba la matriz por rol.
 * - Para coach, aplica reglas de ownership (solo sus socios/tareas).
 */
export function can(user: CurrentUser, action: Action, resource?: ResourceRef): boolean {
  if (!MATRIX[user.role].has(action)) return false;

  if (user.role === "coach" && resource) {
    // Tareas: el coach solo completa las asignadas a él.
    if (action === "task.complete" && resource.assignedToUserId != null) {
      return resource.assignedToUserId === user.id;
    }
    // Recursos de socio/mensaje: el coach solo accede a los de sus socios.
    if (COACH_OWNERSHIP_REQUIRED.has(action) && resource.ownerCoachId !== undefined) {
      return resource.ownerCoachId === user.coachProfileId;
    }
  }
  return true;
}

/** Igual que can() pero lanza ForbiddenError si no está permitido. */
import { ForbiddenError } from "./errors";
export function assertCan(user: CurrentUser, action: Action, resource?: ResourceRef): void {
  if (!can(user, action, resource)) {
    throw new ForbiddenError(`El rol '${user.role}' no puede ejecutar '${action}'`);
  }
}

/** ¿El rol ve TODOS los socios de la org, o solo los suyos (coach)? */
export function seesAllMembers(role: UserRole): boolean {
  return role === "owner" || role === "manager";
}
