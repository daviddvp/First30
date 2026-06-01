import { prisma } from "@/lib/db";
import type { ID } from "@/types";

export interface InternalNote {
  id: ID;
  organizationId: ID;
  memberId: ID;
  authorUserId: ID | null;
  body: string;
  createdAt: string;
}

export const noteRepository = {
  async byMember(orgId: ID, memberId: ID): Promise<InternalNote[]> {
    const rows = await prisma.note.findMany({
      where: { organizationId: orgId, memberId },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((n) => ({
      id: n.id, organizationId: n.organizationId, memberId: n.memberId,
      authorUserId: n.authorId ?? null, body: n.content,
      createdAt: n.createdAt.toISOString(),
    }));
  },

  async create(orgId: ID, memberId: ID, authorUserId: ID | null, body: string): Promise<InternalNote> {
    const row = await prisma.note.create({
      data: {
        organizationId: orgId,
        memberId,
        authorId: authorUserId ?? null,
        content: body,
      },
    });
    return {
      id: row.id, organizationId: row.organizationId, memberId: row.memberId,
      authorUserId: row.authorId ?? null, body: row.content,
      createdAt: row.createdAt.toISOString(),
    };
  },
};
