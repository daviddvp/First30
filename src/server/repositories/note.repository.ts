import { genId, nowISO } from "@/data/store";
import type { ID } from "@/types";

export interface InternalNote {
  id: ID; organizationId: ID; memberId: ID; authorUserId: ID; body: string; createdAt: string;
}
// Almacén en memoria (se reinicia al recargar el módulo). Sustituible por tabla real.
const notes: InternalNote[] = [];

export const noteRepository = {
  byMember(orgId: ID, memberId: ID): InternalNote[] {
    return notes.filter((n) => n.organizationId === orgId && n.memberId === memberId)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  },
  create(orgId: ID, memberId: ID, authorUserId: ID, body: string): InternalNote {
    const note: InternalNote = { id: genId("note"), organizationId: orgId, memberId, authorUserId, body, createdAt: nowISO() };
    notes.push(note);
    return note;
  },
};
