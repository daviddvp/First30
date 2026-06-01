import { noteRepository, type InternalNote } from "../repositories/note.repository";
import { memberRepository } from "../repositories/member.repository";
import { assertCan } from "@/lib/permissions";
import { canSeeMember, ownerCoachOf } from "@/lib/tenant-scope";
import { NotFoundError } from "@/lib/errors";
import type { RequestContext } from "@/lib/auth";
import type { ID } from "@/types";

export const noteService = {
  async list(ctx: RequestContext, memberId: ID): Promise<InternalNote[]> {
    const m = await memberRepository.findById(ctx.organizationId, memberId);
    if (!m) throw new NotFoundError("Socio");
    assertCan(ctx.user, "member.read", { ownerCoachId: ownerCoachOf(m.assignedCoachId) });
    if (!canSeeMember(ctx, m.assignedCoachId)) throw new NotFoundError("Socio");
    return noteRepository.byMember(ctx.organizationId, memberId);
  },

  async add(ctx: RequestContext, memberId: ID, body: string): Promise<InternalNote> {
    const m = await memberRepository.findById(ctx.organizationId, memberId);
    if (!m) throw new NotFoundError("Socio");
    assertCan(ctx.user, "member.update", { ownerCoachId: ownerCoachOf(m.assignedCoachId) });
    if (!canSeeMember(ctx, m.assignedCoachId)) throw new NotFoundError("Socio");
    return noteRepository.create(ctx.organizationId, memberId, ctx.user.id, body);
  },
};
