import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { memberDetailService } from "@/server/services/member-detail.service";

export const dynamic = "force-dynamic";

export function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => ok(await memberDetailService.forMember(getRequestContext(req), params.id)));
}
