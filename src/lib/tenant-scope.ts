// ─────────────────────────────────────────────────────────────────────────────
// First30 — Aislamiento multi-tenant + visibilidad por rol.
//
// Provee helpers para construir filtros de query basados en el rol del usuario.
// Los repositorios aplican estos filtros al hacer queries a Prisma.
//
// Coach solo ve sus socios/tareas/alertas.
// Owner y manager ven todo dentro de su organización.
// ─────────────────────────────────────────────────────────────────────────────
import { seesAllMembers } from "./permissions";
import type { RequestContext } from "./auth";
import type { ID } from "../types";

export interface VisibilityFilters {
  /** Si está presente, filtrar por assignedCoachId (socios) */
  coachId?: ID;
  /** Si está presente, filtrar tareas por assignedToUserId */
  assignedToUserId?: ID;
  /** Si true, el usuario ve todos los recursos de la org */
  seeAll: boolean;
}

/**
 * Retorna los filtros de visibilidad para un usuario.
 * Los repositorios usan estos filtros para limitar las queries.
 */
export function getVisibilityFilters(ctx: RequestContext): VisibilityFilters {
  const { user } = ctx;
  const seeAll = seesAllMembers(user.role);

  if (seeAll) {
    return { seeAll: true };
  }

  return {
    seeAll: false,
    coachId: user.coachProfileId ?? undefined,
    assignedToUserId: user.id,
  };
}

/**
 * Determina si el usuario puede ver un socio concreto.
 * member.assignedCoachId debe haberse obtenido previamente.
 */
export function canSeeMember(ctx: RequestContext, memberCoachId: ID | null): boolean {
  if (seesAllMembers(ctx.user.role)) return true;
  return memberCoachId === ctx.user.coachProfileId;
}

/**
 * Devuelve el CoachProfile.id del dueño de un socio (para checks de permiso).
 * Si el usuario no puede ver el recurso, devuelve null.
 * ownerCoachId es el assignedCoachId del socio (ya cargado).
 */
export function ownerCoachOf(assignedCoachId: ID | null): ID | null {
  return assignedCoachId ?? null;
}
