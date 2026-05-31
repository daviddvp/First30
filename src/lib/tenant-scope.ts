/* Capa de aislamiento multi-tenant + visibilidad por rol.
   Envuelve orgScope (ya scoped por organizationId) y añade el filtrado de
   coach: un coach solo "ve" sus socios asignados y las tareas asignadas a él.
   Owner y manager ven todo dentro de su organización. */
import { orgScope, type OrgScope } from "../data/mock-db";
import { seesAllMembers } from "./permissions";
import type { RequestContext } from "./auth";
import type { Member, Task, RiskAlert, ID } from "../types";

export interface ScopedView {
  ctx: RequestContext;
  org: OrgScope;
  /** Socios visibles para el usuario (coach => solo los suyos). */
  visibleMembers(): Member[];
  /** ¿El usuario puede ver este socio concreto? */
  canSeeMember(memberId: ID): boolean;
  /** Tareas visibles (coach => asignadas a él). */
  visibleTasks(): Task[];
  /** Alertas visibles (coach => de sus socios). */
  visibleAlerts(): RiskAlert[];
  /** CoachProfile.id dueño de un socio (para checks de permiso). */
  ownerCoachOf(memberId: ID): ID | null;
}

export function scopedView(ctx: RequestContext): ScopedView {
  const org = orgScope(ctx.organizationId);
  const { user } = ctx;
  const all = seesAllMembers(user.role);

  const visibleMembers = () =>
    all ? org.members() : org.members().filter((m) => m.assignedCoachId === user.coachProfileId);

  const visibleMemberIds = () => new Set(visibleMembers().map((m) => m.id));

  return {
    ctx,
    org,
    visibleMembers,
    canSeeMember: (memberId) => {
      if (all) return !!org.member(memberId);
      const m = org.member(memberId);
      return !!m && m.assignedCoachId === user.coachProfileId;
    },
    visibleTasks: () =>
      all ? org.tasks() : org.tasks().filter((t) => t.assignedToUserId === user.id),
    visibleAlerts: () => {
      if (all) return org.alerts();
      const ids = visibleMemberIds();
      return org.alerts().filter((a) => ids.has(a.memberId));
    },
    ownerCoachOf: (memberId) => org.member(memberId)?.assignedCoachId ?? null,
  };
}
