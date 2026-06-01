import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { MemberDetailView } from "@/components/members/MemberDetailView";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  // Cargar el socio desde la base de datos real.
  // En MOCK_AUTH mode: la DB puede no estar configurada — fallback graceful.
  let member: { id: string; fullName: string; onboardingDay: number; mainGoal: string | null; assignedCoachId: string | null } | null = null;
  let firstCoachId: string | null = null;

  try {
    member = await prisma.member.findUnique({
      where: { id: params.id },
      select: { id: true, fullName: true, onboardingDay: true, mainGoal: true, assignedCoachId: true },
    });
    if (!member) notFound();

    // Primer coach de la organización del socio (para el CTA de asignar).
    const coachProfile = await prisma.coachProfile.findFirst({
      where: { organizationId: (await prisma.member.findUnique({ where: { id: params.id }, select: { organizationId: true } }))?.organizationId },
      select: { id: true },
    });
    firstCoachId = coachProfile?.id ?? null;
  } catch {
    // Si la DB no está disponible (dev sin DB), intentamos mock-db como fallback.
    try {
      const { orgScope } = await import("@/data/mock-db");
      const { resolveDefaultOrg } = await import("@/lib/tenant");
      const scope = orgScope(resolveDefaultOrg());
      const mockMember = scope.member(params.id);
      if (!mockMember) notFound();
      member = mockMember;
      firstCoachId = scope.coachProfiles()[0]?.id ?? null;
    } catch {
      notFound();
    }
  }

  if (!member) notFound();

  // Construir un objeto Member mínimo compatible con MemberDetailView
  const memberForView = {
    ...member,
    organizationId: "",      // MemberDetailView lo deriva del contexto
    email: "",
    phone: "",
    joinDate: "",
    status: "in_progress" as const,
    riskLevel: "low" as const,
    riskReason: null,
    mainGoal: member.mainGoal ?? "",
    level: "beginner" as const,
    limitations: null,
    fears: null,
    acquisitionSource: "",
    lastAttendanceAt: null,
    nextRecommendedAction: "",
    activationScore: 0,
    createdAt: "",
    updatedAt: "",
  };

  return (
    <div className="fade-in">
      <PageHeader
        eyebrow="Ficha de socio"
        title={member.fullName}
        description={`Día ${member.onboardingDay} de 30 · ${member.mainGoal ?? ""}`}
      />
      <MemberDetailView member={memberForView} coachId={member.assignedCoachId ?? firstCoachId} />
    </div>
  );
}
