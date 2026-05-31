import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { MembersView } from "@/components/members/MembersView";

export const dynamic = "force-dynamic";

export default function MembersPage() {
  return (
    <div className="fade-in">
      <PageHeader eyebrow="Operación" title="Nuevos socios"
        description="Listado operativo de cada socio en sus primeros 30 días. Busca y filtra por estado, riesgo, coach o día de onboarding."
        action={<Button icon={Plus}>Añadir socio</Button>} />
      <MembersView />
    </div>
  );
}
