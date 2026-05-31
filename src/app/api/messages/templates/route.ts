import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { messageService } from "@/server/services/message.service";
import { templateListQuerySchema } from "@/server/schemas/message.schema";

export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const { category } = templateListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    return ok(messageService.templates(ctx, category));
  });
}
