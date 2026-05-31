import { memberRepository, type MemberFilters } from "../repositories/member.repository";
import { coachRepository } from "../repositories/coach.repository";
import { auditRepository } from "../repositories/audit.repository";
import { nowISO } from "@/data/store";
import { NotFoundError, RuleViolationError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import { scopedView } from "@/lib/tenant-scope";
import { firstName } from "@/lib/formatters";
import type { RequestContext } from "@/lib/auth";
import type { ID, Member } from "@/types";
import type { CreateMemberInput, UpdateMemberInput } from "../schemas/member.schema";

export const memberService = {
  list(ctx: RequestContext, filters: MemberFilters): Member[] {
    assertCan(ctx.user, "member.read");
    const view = scopedView(ctx);
    // Partimos de los socios VISIBLES para el rol y aplicamos filtros encima.
    let rows = view.visibleMembers();
    if (filters.status) rows = rows.filter((m) => m.status === filters.status);
    if (filters.riskLevel) rows = rows.filter((m) => m.riskLevel === filters.riskLevel);
    if (filters.coachId) rows = rows.filter((m) => m.assignedCoachId === filters.coachId);
    if (filters.onboardingMin != null) rows = rows.filter((m) => m.onboardingDay >= filters.onboardingMin!);
    if (filters.onboardingMax != null) rows = rows.filter((m) => m.onboardingDay <= filters.onboardingMax!);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      rows = rows.filter((m) => m.fullName.toLowerCase().includes(q) || m.mainGoal.toLowerCase().includes(q));
    }
    return rows.sort((a, b) => a.onboardingDay - b.onboardingDay);
  },

  get(ctx: RequestContext, id: ID): Member {
    const view = scopedView(ctx);
    const owner = view.ownerCoachOf(id);
    assertCan(ctx.user, "member.read", { ownerCoachId: owner });
    const m = memberRepository.findById(ctx.organizationId, id);
    if (!m || !view.canSeeMember(id)) throw new NotFoundError("Socio");
    return m;
  },

  create(ctx: RequestContext, input: CreateMemberInput): Member {
    assertCan(ctx.user, "member.create");
    if (input.assignedCoachId && !coachRepository.findById(ctx.organizationId, input.assignedCoachId)) {
      throw new RuleViolationError("El coach indicado no pertenece a esta organización");
    }
    const status = input.assignedCoachId ? "in_progress" : "no_coach";
    const member = memberRepository.create(ctx.organizationId, {
      fullName: input.fullName, email: input.email, phone: input.phone,
      joinDate: nowISO(), onboardingDay: 0, status, riskLevel: "low", riskReason: null,
      mainGoal: input.mainGoal, level: input.level, limitations: input.limitations ?? null,
      fears: input.fears ?? null, acquisitionSource: input.acquisitionSource,
      assignedCoachId: input.assignedCoachId ?? null, lastAttendanceAt: null,
      nextRecommendedAction: input.assignedCoachId ? "Enviar bienvenida" : "Asignar coach",
      activationScore: 0,
    });
    auditRepository.record(ctx.organizationId, ctx.user.id, "Member", member.id, "created");
    return member;
  },

  update(ctx: RequestContext, id: ID, patch: UpdateMemberInput): Member {
    const view = scopedView(ctx);
    assertCan(ctx.user, "member.update", { ownerCoachId: view.ownerCoachOf(id) });
    if (!view.canSeeMember(id)) throw new NotFoundError("Socio");
    const updated = memberRepository.update(ctx.organizationId, id, patch);
    if (!updated) throw new NotFoundError("Socio");
    auditRepository.record(ctx.organizationId, ctx.user.id, "Member", id, "updated", patch);
    return updated;
  },

  assignCoach(ctx: RequestContext, id: ID, coachId: ID): Member {
    assertCan(ctx.user, "member.assignCoach");
    const coach = coachRepository.findById(ctx.organizationId, coachId);
    if (!coach) throw new NotFoundError("Coach");
    const member = memberRepository.findById(ctx.organizationId, id);
    if (!member) throw new NotFoundError("Socio");
    const nextStatus = member.status === "no_coach" ? "in_progress" : member.status;
    const updated = memberRepository.update(ctx.organizationId, id, {
      assignedCoachId: coachId, status: nextStatus,
      nextRecommendedAction: member.status === "no_coach" ? "Enviar bienvenida" : member.nextRecommendedAction,
    })!;
    auditRepository.record(ctx.organizationId, ctx.user.id, "Member", id, "assigned_coach", { coachId });
    return updated;
  },

  markContacted(ctx: RequestContext, id: ID): Member {
    const view = scopedView(ctx);
    assertCan(ctx.user, "member.update", { ownerCoachId: view.ownerCoachOf(id) });
    if (!view.canSeeMember(id)) throw new NotFoundError("Socio");
    const member = memberRepository.findById(ctx.organizationId, id)!;
    const updated = memberRepository.update(ctx.organizationId, id, {
      nextRecommendedAction: `Seguimiento tras contacto con ${firstName(member.fullName)}`,
    })!;
    auditRepository.record(ctx.organizationId, ctx.user.id, "Member", id, "updated", { contacted: true });
    return updated;
  },
};
