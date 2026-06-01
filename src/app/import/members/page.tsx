import { PageHeader } from "@/components/ui/PageHeader";
import { MemberCsvImporter } from "@/components/imports/MemberCsvImporter";
import { Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ImportMembersPage() {
  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Importar socios"
        title="Importar socios desde CSV"
        description="Carga los socios de tu box desde un archivo Excel o CSV. First30 detectará riesgos y preparará acciones recomendadas automáticamente."
        action={
          <a
            href="/api/imports/members/template"
            download="first30-socios-plantilla.csv"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink transition hover:bg-subtle"
          >
            <Upload size={14} />
            Descargar plantilla
          </a>
        }
      />
      <MemberCsvImporter />
    </div>
  );
}
