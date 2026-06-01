// GET /api/imports/members/template
// Descarga la plantilla CSV para importación de socios.
import { NextResponse } from "next/server";
import { generateTemplateCsv } from "@/lib/csv/generate-template";

export const dynamic = "force-dynamic";

export function GET() {
  const csv = generateTemplateCsv();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="first30-socios-plantilla.csv"',
    },
  });
}
