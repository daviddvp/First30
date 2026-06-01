import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { taskService } from "@/server/services/task.service";
import { taskListQuerySchema, createTaskSchema } from "@/server/schemas/task.schema";

export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const q = taskListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    return ok(await taskService.list(ctx, q));
  });
}
export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const input = createTaskSchema.parse(await req.json());
    return ok(await taskService.create(ctx, input), 201);
  });
}
