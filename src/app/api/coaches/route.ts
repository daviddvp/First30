import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { coachService } from "@/server/services/coach.service";

export const dynamic = "force-dynamic";
export function GET(req: NextRequest) {
  return handle(async () => ok(await coachService.list(getRequestContext(req))));
}
