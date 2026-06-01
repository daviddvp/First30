// POST /api/imports/members/confirm
// Recibe las filas validadas y las persiste. El organizationId viene del usuario.
import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { confirmMemberImport } from "@/server/services/member-import.service";
import { ValidationError } from "@/lib/errors";
import type { ValidatedImportRow } from "@/lib/csv/member-import-types";

export const dynamic = "force-dynamic";

export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const body = await req.json().catch(() => ({}));

    if (!Array.isArray(body.rows)) throw new ValidationError("Se requiere el array 'rows'");
    const rows = body.rows as ValidatedImportRow[];
    const fileName = body.fileName ?? "import.csv";

    const result = await confirmMemberImport(ctx, rows, fileName);
    return ok(result, 201);
  });
}
