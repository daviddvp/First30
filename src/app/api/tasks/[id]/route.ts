import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { taskService } from "@/server/services/task.service";
import { updateTaskSchema } from "@/server/schemas/task.schema";

export const dynamic = "force-dynamic";
export function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const patch = updateTaskSchema.parse(await req.json());
    return ok(await taskService.update(ctx, params.id, patch));
  });
}
