// GET /api/users
// Devuelve la lista de usuarios de la organización del usuario autenticado.
// Usado por el filtro de "Responsable" en la pantalla de tareas.
import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface UserListItem {
  id: string;
  name: string;
  role: string;
}

export function GET(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const users = await prisma.user.findMany({
      where: { organizationId: ctx.organizationId },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
    return ok(users as UserListItem[]);
  });
}
