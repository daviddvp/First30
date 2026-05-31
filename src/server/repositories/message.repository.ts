import { store, genId, nowISO } from "@/data/store";
import { orgScope } from "@/data/mock-db";
import type { ID, MessageTemplate, MessageLog } from "@/types";

export const messageRepository = {
  listTemplates(orgId: ID, category?: string): MessageTemplate[] {
    let rows = orgScope(orgId).templates();
    if (category) rows = rows.filter((t) => t.category === category);
    return rows;
  },
  findTemplate(orgId: ID, id: ID): MessageTemplate | undefined {
    return orgScope(orgId).template(id);
  },
  logsByMember(orgId: ID, memberId: ID): MessageLog[] {
    return orgScope(orgId).messageLogsByMember(memberId);
  },
  createLog(orgId: ID, data: Omit<MessageLog, "id" | "organizationId" | "createdAt">): MessageLog {
    const log: MessageLog = { ...data, id: genId("log"), organizationId: orgId, createdAt: nowISO() };
    store.messageLogs.push(log);
    return log;
  },
};
