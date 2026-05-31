import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { taskService } from "@/server/services/task.service";
import { completeTaskSchema } from "@/server/schemas/task.schema";

export const dynamic = "force-dynamic";
export function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const { completed } = completeTaskSchema.parse(await req.json().catch(() => ({})));
    return ok(taskService.setCompleted(ctx, params.id, completed));
  });
}
