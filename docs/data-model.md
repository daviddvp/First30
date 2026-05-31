# Modelo de datos

Multi-tenant: toda entidad (salvo `Organization`) lleva `organizationId`. Marcas de tiempo
en ISO 8601. Definición completa en `src/types/index.ts`.

## Entidades
- **Organization**: el tenant (box). `slug`, `timezone`, `brandingColor`.
- **User**: persona del equipo. `role: owner | manager | coach`.
- **CoachProfile**: extiende a usuarios coach. `specialties`, `maxActiveNewMembers`, `active`.
- **Member**: socio en sus primeros 30 días. `status`, `riskLevel`, `mainGoal`, `level`,
  `assignedCoachId`, `lastAttendanceAt`, `activationScore`, `onboardingDay`.
- **Attendance**: asistencia a clase. Deriva `lastAttendanceAt`.
- **CheckIn**: contacto de seguimiento. `day`, `status`, `sentiment`.
- **Task**: acción del equipo. `priority`, `status`, `assignedToUserId`, `completedAt`.
- **RiskAlert**: alerta de abandono. `riskLevel`, `reason`, `suggestedAction`, `status`, `resolvedAt`.
- **MessageTemplate / MessageLog**: plantillas y registro de envíos.
- **OnboardingRule**: umbrales de las reglas de riesgo (configurable).
- **WeeklyReport**: informe semanal con `metricsJson` y `summary`.
- **AuditLog**: trazabilidad: `actorUserId`, `action`, `entityType`, `entityId`, `metadata`.
- **InternalNote** (en memoria): notas del equipo por socio.

## Enums
- `MemberStatus`: in_progress | at_risk | activated | no_coach | completed | churned
- `RiskLevel`: high | medium | low
- `MemberLevel`: beginner | intermediate | advanced
- `Priority`: low | medium | high
- `TaskStatus`: today | this_week | pending | completed | cancelled
- `CheckInStatus`: pending | sent | responded | missed
- `AlertStatus`: open | snoozed | resolved

## Reglas de coherencia (verificadas en seed)
- `no_coach` ⇒ `assignedCoachId === null`.
- Tarea `completed` ⇒ `completedAt` presente; si no, `null`.
- Alerta `resolved` ⇒ `resolvedAt` presente; si no, `null`.
- Socio en día ≥30 ⇒ historial de asistencias suficiente.
- Ninguna referencia cruza de organización (coach, assignee, plantilla del mismo tenant).
