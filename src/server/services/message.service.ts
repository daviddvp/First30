import { messageRepository } from "../repositories/message.repository";
import { memberRepository } from "../repositories/member.repository";
import { auditRepository } from "../repositories/audit.repository";
import { NotFoundError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import { canSeeMember, ownerCoachOf } from "@/lib/tenant-scope";
import { renderTemplate, firstName } from "@/lib/formatters";
import type { RequestContext } from "@/lib/auth";
import type { ID, MessageTemplate, MessageLog } from "@/types";

export const messageService = {
  async templates(ctx: RequestContext, category?: string): Promise<MessageTemplate[]> {
    assertCan(ctx.user, "message.use");
    return messageRepository.listTemplates(ctx.organizationId, category);
  },

  async copy(ctx: RequestContext, templateId: ID, memberId: ID): Promise<{ body: string; log: MessageLog }> {
    const member = await memberRepository.findById(ctx.organizationId, memberId);
    if (!member) throw new NotFoundError("Socio");
    assertCan(ctx.user, "message.use", { ownerCoachId: ownerCoachOf(member.assignedCoachId) });
    if (!canSeeMember(ctx, member.assignedCoachId)) throw new NotFoundError("Socio");

    const tpl = await messageRepository.findTemplate(ctx.organizationId, templateId);
    if (!tpl) throw new NotFoundError("Plantilla");

    const body = renderTemplate(tpl.body, { nombre: firstName(member.fullName) });
    const log = await messageRepository.createLog(ctx.organizationId, {
      memberId, templateId, sentByUserId: ctx.user.id, channel: "whatsapp",
      body, status: "copied", copiedAt: new Date().toISOString(), sentAt: null,
    });
    await auditRepository.record(ctx.organizationId, ctx.user.id, "MessageLog", log.id, "sent_message", { action: "copied" });
    return { body, log };
  },

  async log(
    ctx: RequestContext,
    input: { memberId: ID; templateId: ID | null; channel: MessageLog["channel"]; body: string; status: "copied" | "sent" },
  ): Promise<MessageLog> {
    const member = await memberRepository.findById(ctx.organizationId, input.memberId);
    if (!member) throw new NotFoundError("Socio");
    assertCan(ctx.user, "message.use", { ownerCoachId: ownerCoachOf(member.assignedCoachId) });
    if (!canSeeMember(ctx, member.assignedCoachId)) throw new NotFoundError("Socio");

    const now = new Date().toISOString();
    const log = await messageRepository.createLog(ctx.organizationId, {
      memberId: input.memberId, templateId: input.templateId, sentByUserId: ctx.user.id,
      channel: input.channel, body: input.body, status: input.status,
      copiedAt: input.status === "copied" ? now : null,
      sentAt: input.status === "sent" ? now : null,
    });
    await auditRepository.record(ctx.organizationId, ctx.user.id, "MessageLog", log.id, "sent_message", { status: input.status });
    return log;
  },
};
