// POST /api/imports/members/preview
// Recibe el CSV y devuelve una preview con filas validadas.
// No persiste nada. El organizationId viene del usuario autenticado.
import type { NextRequest } from "next/server";
import { ok, handle } from "@/lib/api-response";
import { getRequestContext } from "@/lib/auth";
import { previewMemberImport } from "@/server/services/member-import.service";
import { ValidationError } from "@/lib/errors";
import type { ColumnMapping } from "@/lib/csv/member-import-types";

export const dynamic = "force-dynamic";

export function POST(req: NextRequest) {
  return handle(async () => {
    const ctx = getRequestContext(req);
    const contentType = req.headers.get("content-type") ?? "";

    let csvText = "";
    let fileName = "import.csv";
    let customMappings: ColumnMapping[] | undefined;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!file || typeof file === "string") throw new ValidationError("Se requiere un archivo CSV");
      csvText = await (file as File).text();
      fileName = (file as File).name;
      const mappingsRaw = form.get("mappings");
      if (mappingsRaw && typeof mappingsRaw === "string") {
        customMappings = JSON.parse(mappingsRaw);
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (!body.csvText) throw new ValidationError("Se requiere csvText en el body");
      csvText = body.csvText;
      fileName = body.fileName ?? "import.csv";
      customMappings = body.mappings;
    }

    if (!csvText.trim()) throw new ValidationError("El archivo CSV está vacío");

    const preview = await previewMemberImport(ctx, csvText, customMappings);
    return ok({ ...preview, fileName });
  });
}
