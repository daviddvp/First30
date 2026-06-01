import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { reportService } from "@/server/services/report.service";

export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    return ok({ latest: await reportService.latest(ctx) ?? null, history: await reportService.list(ctx) });
  });
}
