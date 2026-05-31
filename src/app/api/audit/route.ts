import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { auditService } from "@/server/services/audit.service";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  return handle(async () => ok(auditService.recent(getRequestContext(req), 20)));
}
