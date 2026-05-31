import { messageRepository } from "../repositories/message.repository";
import { memberRepository } from "../repositories/member.repository";
import { auditRepository } from "../repositories/audit.repository";
import { nowISO } from "@/data/store";
import { NotFoundError } from "@/lib/errors";
import { assertCan } from "@/lib/permissions";
import { scopedView } from "@/lib/tenant-scope";
import { renderTemplate, firstName } from "@/lib/formatters";
import type { RequestContext } from "@/lib/auth";
import type { ID, MessageTemplate, MessageLog } from "@/types";

export const messageService = {
  templates(ctx: RequestContext, category?: string): MessageTemplate[] {
    assertCan(ctx.user, "message.use");
    return messageRepository.listTemplates(ctx.organizationId, category);
  },

  copy(ctx: RequestContext, templateId: ID, memberId: ID): { body: string; log: MessageLog } {
    const view = scopedView(ctx);
    // El coach solo usa mensajes de sus socios (ownership).
    assertCan(ctx.user, "message.use", { ownerCoachId: view.ownerCoachOf(memberId) });
    if (!view.canSeeMember(memberId)) throw new NotFoundError("Socio");
    const tpl = messageRepository.findTemplate(ctx.organizationId, templateId);
    if (!tpl) throw new NotFoundError("Plantilla");
    const member = memberRepository.findById(ctx.organizationId, memberId)!;
    const body = renderTemplate(tpl.body, { nombre: firstName(member.fullName) });
    const log = messageRepository.createLog(ctx.organizationId, {
      memberId, templateId, sentByUserId: ctx.user.id, channel: "whatsapp",
      body, status: "copied", copiedAt: nowISO(), sentAt: null,
    });
    auditRepository.record(ctx.organizationId, ctx.user.id, "MessageLog", log.id, "sent_message", { action: "copied" });
    return { body, log };
  },

  log(ctx: RequestContext, input: { memberId: ID; templateId: ID | null; channel: MessageLog["channel"]; body: string; status: "copied" | "sent" }): MessageLog {
    const view = scopedView(ctx);
    assertCan(ctx.user, "message.use", { ownerCoachId: view.ownerCoachOf(input.memberId) });
    if (!view.canSeeMember(input.memberId)) throw new NotFoundError("Socio");
    const log = messageRepository.createLog(ctx.organizationId, {
      memberId: input.memberId, templateId: input.templateId, sentByUserId: ctx.user.id,
      channel: input.channel, body: input.body, status: input.status,
      copiedAt: input.status === "copied" ? nowISO() : null,
      sentAt: input.status === "sent" ? nowISO() : null,
    });
    auditRepository.record(ctx.organizationId, ctx.user.id, "MessageLog", log.id, "sent_message", { status: input.status });
    return log;
  },
};
