import { memberRepository, type MemberFilters } from "../repositories/member.repository";
import { trackServerEvent } from "@/lib/analytics";
import { coachRepository } from "../repositories/coach.repository";
import { auditRepository } from "../repositories/audit.repository";
import { NotFoundError, RuleViolationError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import { getVisibilityFilters, canSeeMember, ownerCoachOf } from "@/lib/tenant-scope";
import { firstName } from "@/lib/formatters";
import type { RequestContext } from "@/lib/auth";
import type { ID, Member } from "@/types";
import type { CreateMemberInput, UpdateMemberInput } from "../schemas/member.schema";

export const memberService = {
  async list(ctx: RequestContext, filters: MemberFilters): Promise<Member[]> {
    assertCan(ctx.user, "member.read");
    const vis = getVisibilityFilters(ctx);
    return memberRepository.list(ctx.organizationId, {
      ...filters,
      // Si es coach, forzar filtro por su coachProfileId
      ...(vis.coachId && { coachId: vis.coachId }),
    });
  },

  async get(ctx: RequestContext, id: ID): Promise<Member> {
    const m = await memberRepository.findById(ctx.organizationId, id);
    if (!m) throw new NotFoundError("Socio");
    const owner = ownerCoachOf(m.assignedCoachId);
    assertCan(ctx.user, "member.read", { ownerCoachId: owner });
    if (!canSeeMember(ctx, m.assignedCoachId)) throw new NotFoundError("Socio");
    return m;
  },

  async create(ctx: RequestContext, input: CreateMemberInput): Promise<Member> {
    assertCan(ctx.user, "member.create");
    if (input.assignedCoachId) {
      const coach = await coachRepository.findById(ctx.organizationId, input.assignedCoachId);
      if (!coach) throw new RuleViolationError("El coach indicado no pertenece a esta organización");
    }
    const status = input.assignedCoachId ? "in_progress" : "no_coach";
    const member = await memberRepository.create(ctx.organizationId, {
      fullName: input.fullName, email: input.email, phone: input.phone,
      joinDate: new Date().toISOString(), onboardingDay: 0, status, riskLevel: "low",
      riskReason: null, mainGoal: input.mainGoal, level: input.level,
      limitations: input.limitations ?? null, fears: input.fears ?? null,
      acquisitionSource: input.acquisitionSource,
      assignedCoachId: input.assignedCoachId ?? null, lastAttendanceAt: null,
      nextRecommendedAction: input.assignedCoachId ? "Enviar bienvenida" : "Asignar coach",
      activationScore: 0,
    });
    await auditRepository.record(ctx.organizationId, ctx.user.id, "Member", member.id, "created");
    return member;
  },

  async update(ctx: RequestContext, id: ID, patch: UpdateMemberInput): Promise<Member> {
    const m = await memberRepository.findById(ctx.organizationId, id);
    if (!m) throw new NotFoundError("Socio");
    assertCan(ctx.user, "member.update", { ownerCoachId: ownerCoachOf(m.assignedCoachId) });
    if (!canSeeMember(ctx, m.assignedCoachId)) throw new NotFoundError("Socio");
    const updated = await memberRepository.update(ctx.organizationId, id, patch);
    if (!updated) throw new NotFoundError("Socio");
    await auditRepository.record(ctx.organizationId, ctx.user.id, "Member", id, "updated", patch as Record<string, unknown>);
    return updated;
  },

  async assignCoach(ctx: RequestContext, id: ID, coachId: ID): Promise<Member> {
    assertCan(ctx.user, "member.assignCoach");
    const coach = await coachRepository.findById(ctx.organizationId, coachId);
    if (!coach) throw new NotFoundError("Coach");
    const member = await memberRepository.findById(ctx.organizationId, id);
    if (!member) throw new NotFoundError("Socio");
    const nextStatus = member.status === "no_coach" ? "in_progress" : member.status;
    const updated = await memberRepository.update(ctx.organizationId, id, {
      assignedCoachId: coachId, status: nextStatus,
      nextRecommendedAction: member.status === "no_coach" ? "Enviar bienvenida" : member.nextRecommendedAction,
    });
    if (!updated) throw new NotFoundError("Socio");
    await auditRepository.record(ctx.organizationId, ctx.user.id, "Member", id, "assigned_coach", { coachId });
    trackServerEvent("member_assigned_coach", ctx, { memberId: id });
    return updated;
  },

  async markContacted(ctx: RequestContext, id: ID): Promise<Member> {
    const m = await memberRepository.findById(ctx.organizationId, id);
    if (!m) throw new NotFoundError("Socio");
    assertCan(ctx.user, "member.update", { ownerCoachId: ownerCoachOf(m.assignedCoachId) });
    if (!canSeeMember(ctx, m.assignedCoachId)) throw new NotFoundError("Socio");
    const updated = await memberRepository.update(ctx.organizationId, id, {
      nextRecommendedAction: `Seguimiento tras contacto con ${firstName(m.fullName)}`,
    });
    if (!updated) throw new NotFoundError("Socio");
    await auditRepository.record(ctx.organizationId, ctx.user.id, "Member", id, "contacted", { contacted: true });
    trackServerEvent("member_marked_contacted", ctx, { memberId: id });
    return updated;
  },
};
