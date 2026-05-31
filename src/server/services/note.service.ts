import { noteRepository, type InternalNote } from "../repositories/note.repository";
import { scopedView } from "@/lib/tenant-scope";
import { assertCan } from "@/lib/permissions";
import { NotFoundError } from "@/lib/errors";
import type { RequestContext } from "@/lib/auth";
import type { ID } from "@/types";

export const noteService = {
  list(ctx: RequestContext, memberId: ID): InternalNote[] {
    const view = scopedView(ctx);
    assertCan(ctx.user, "member.read", { ownerCoachId: view.ownerCoachOf(memberId) });
    if (!view.canSeeMember(memberId)) throw new NotFoundError("Socio");
    return noteRepository.byMember(ctx.organizationId, memberId);
  },
  add(ctx: RequestContext, memberId: ID, body: string): InternalNote {
    const view = scopedView(ctx);
    assertCan(ctx.user, "member.update", { ownerCoachId: view.ownerCoachOf(memberId) });
    if (!view.canSeeMember(memberId)) throw new NotFoundError("Socio");
    return noteRepository.create(ctx.organizationId, memberId, ctx.user.id, body);
  },
};
