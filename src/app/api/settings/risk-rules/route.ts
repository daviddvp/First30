import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { settingsService } from "@/server/services/settings.service";
import { updateRiskRulesSchema } from "@/server/schemas/settings.schema";

export const dynamic = "force-dynamic";
export function PATCH(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const { rules } = updateRiskRulesSchema.parse(await req.json());
    return ok(await settingsService.updateRules(ctx, rules));
  });
}
