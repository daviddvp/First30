import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { messageService } from "@/server/services/message.service";
import { logMessageSchema } from "@/server/schemas/message.schema";

export const dynamic = "force-dynamic";
export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const input = logMessageSchema.parse(await req.json());
    return ok(await messageService.log(ctx, input), 201);
  });
}
