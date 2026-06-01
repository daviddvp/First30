import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { memberService } from "@/server/services/member.service";

export const dynamic = "force-dynamic";

export function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => ok(await memberService.markContacted(getRequestContext(req), params.id)));
}
