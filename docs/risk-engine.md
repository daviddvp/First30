# Motores de negocio

Funciones puras en `src/lib/` (sin React ni queries). Reciben un `MemberContext`
(`engine-input.ts`) cargado por `insight.service` y devuelven resultados.

## Risk engine (`risk-engine.ts`)
Evalúa 6 reglas y emite `RiskFinding[]` (no muta; un service decide si persiste la alerta).
Los umbrales salen de `OnboardingRule`, así que Configuración cambia el comportamiento.

1. **no_return_7d** (alto): primera clase hecha, sin segunda visita y ≥7 días sin volver.
2. **low_attendance_14d** (medio): < 2 asistencias en los primeros 14 días.
3. **no_coach** (medio): sin `assignedCoachId`.
4. **checkin_no_response** (medio): check-in de día 3 o 14 en estado missed/sent.
5. **cancel_streak** (medio): dos cancelaciones seguidas.
6. **injury_no_adaptation** (medio): limitación por lesión sin nota de adaptación en asistencias.

`topRisk` = mayor severidad entre los hallazgos.

## Activation Score (`activation-score.ts`)
0–100: +25 segunda visita, +20 (≥2 asist. en 14d), +15 coach, +15 check-in respondido,
+15 próxima clase, −20 alerta alta abierta, −10 alerta media abierta. Acotado a [0,100].
Clasificación: 0–39 alto · 40–69 medio · 70–100 bajo.

## Onboarding engine (`onboarding-engine.ts`)
Deriva el estado en orden: `no_coach` → `completed` (día≥30) → `at_risk` (alerta open
high/medium) → `activated` (score≥70 y segunda visita) → `in_progress`. Respeta override
manual y nunca pisa `churned`. Devuelve el `source` (auto/manual).

## Next Best Action (`next-best-action.ts`)
Una sola acción priorizada por socio, con categoría de plantilla y CTA.

## Report engine (`report-engine.ts`)
Calcula el informe avanzado: métricas, comparación con semana anterior, distribución por
coach, riesgos abiertos/resueltos, recomendaciones priorizadas y dos resúmenes
(dirección / coaches). Recibe datos scoped; no consulta por su cuenta.
