import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { alertService } from "@/server/services/alert.service";
import { alertListQuerySchema } from "@/server/schemas/alert.schema";

export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const q = alertListQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    return ok(alertService.list(ctx, q));
  });
}
