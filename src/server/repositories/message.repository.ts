import { prisma } from "@/lib/db";
import type { ID, MessageTemplate, MessageLog } from "@/types";

export const messageRepository = {
  async listTemplates(orgId: ID, category?: string): Promise<MessageTemplate[]> {
    const rows = await prisma.messageTemplate.findMany({
      where: {
        organizationId: orgId,
        active: true,
        ...(category && { category }),
      },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toTemplate);
  },

  async findTemplate(orgId: ID, id: ID): Promise<MessageTemplate | undefined> {
    const row = await prisma.messageTemplate.findFirst({
      where: { id, organizationId: orgId, active: true },
    });
    return row ? toTemplate(row) : undefined;
  },

  async logsByMember(orgId: ID, memberId: ID): Promise<MessageLog[]> {
    const rows = await prisma.messageLog.findMany({
      where: { organizationId: orgId, memberId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toLog);
  },

  async createLog(
    orgId: ID,
    data: Omit<MessageLog, "id" | "organizationId" | "createdAt">,
  ): Promise<MessageLog> {
    const row = await prisma.messageLog.create({
      data: {
        organizationId: orgId,
        memberId: data.memberId,
        templateId: data.templateId ?? null,
        sentByUserId: data.sentByUserId ?? null,
        channel: data.channel,
        body: data.body,
        status: data.status,
        copiedAt: data.copiedAt ? new Date(data.copiedAt) : null,
        sentAt: data.sentAt ? new Date(data.sentAt) : null,
      },
    });
    return toLog(row);
  },
};

function toTemplate(p: {
  id: string; organizationId: string; category: string; title: string;
  body: string; variables: string[]; active: boolean; createdAt: Date; updatedAt: Date;
}): MessageTemplate {
  return {
    id: p.id, organizationId: p.organizationId, category: p.category,
    title: p.title, body: p.body, variables: p.variables, active: p.active,
    createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
  };
}

function toLog(p: {
  id: string; organizationId: string; memberId: string; templateId: string | null;
  sentByUserId: string | null; channel: string; body: string; status: string;
  copiedAt: Date | null; sentAt: Date | null; createdAt: Date;
}): MessageLog {
  return {
    id: p.id, organizationId: p.organizationId, memberId: p.memberId,
    templateId: p.templateId, sentByUserId: p.sentByUserId ?? "",
    channel: p.channel as MessageLog["channel"], body: p.body,
    status: p.status as MessageLog["status"],
    copiedAt: p.copiedAt?.toISOString() ?? null,
    sentAt: p.sentAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  };
}
