import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { reportService } from "@/server/services/report.service";

export const dynamic = "force-dynamic";
export function POST(req: NextRequest) {
  return handle(async () => ok(reportService.generate(getRequestContext(req)), 201));
}
