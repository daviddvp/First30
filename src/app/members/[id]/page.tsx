import { notFound } from "next/navigation";
import { orgScope } from "@/data/mock-db";
import { resolveDefaultOrg } from "@/lib/tenant";
import { PageHeader } from "@/components/ui/PageHeader";
import { MemberDetailView } from "@/components/members/MemberDetailView";

export const dynamic = "force-dynamic";

export default function MemberDetailPage({ params }: { params: { id: string } }) {
  const scope = orgScope(resolveDefaultOrg());
  const member = scope.member(params.id);
  if (!member) notFound();

  // Un coach disponible para el CTA de "asignar" (demo).
  const firstCoach = scope.coachProfiles()[0]?.id ?? null;

  return (
    <div className="fade-in">
      <PageHeader eyebrow="Ficha de socio" title={member.fullName}
        description={`Día ${member.onboardingDay} de 30 · ${member.mainGoal}`} />
      <MemberDetailView member={member} coachId={member.assignedCoachId ?? firstCoach} />
    </div>
  );
}
