import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { reportService } from "@/server/services/report.service";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    // Coach recibe su digest operativo; owner/manager el informe completo.
    const report = ctx.user.role === "coach"
      ? await reportService.coachDigest(ctx)
      : await reportService.advanced(ctx);
    return ok(report);
  });
}
