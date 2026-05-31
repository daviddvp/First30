# QA checklist

## Suites automatizadas (`npx tsx scripts/test-all.ts`)
- **validate-seed** (26): conteos del seed y reglas de coherencia + aislamiento.
- **test-engines** (25): risk engine, activation score, estado, next-best-action.
- **test-api** (25): los 20 endpoints, validación Zod, multi-tenant.
- **test-permissions** (8+): RBAC y aislamiento por rol/organización.
- **test-detail** (5): endpoint de detalle y notas internas.
- **test-reports** (17): report-engine, comparación, distribución, permisos.

## Cobertura por área
### Risk engine
- [x] riesgo alto si no hay segunda visita en 7 días.
- [x] riesgo medio si < 2 asistencias en 14 días.
- [x] riesgo si no hay coach.
- [x] check-in no respondido.
- [x] lesión sin adaptación.

### Activation score
- [x] sube con segunda visita / coach.
- [x] baja con alerta high abierta.
- [x] clasifica alto/medio/bajo.

### Member status
- [x] no_coach sin assignedCoachId.
- [x] at_risk con alerta open high/medium.
- [x] activated si score≥70 y segunda visita.
- [x] completed si onboardingDay≥30.

### Permissions
- [x] coach no ve socio de otro coach / otra org.
- [x] manager no accede a otra org.
- [x] owner ve todos los socios de su org.
- [x] coach no edita settings.
- [x] manager resuelve alertas.

### Tasks
- [x] completar cambia status a completed + completedAt.
- [x] tarea creada siempre con organizationId.

### Reports
- [x] métricas correctas; no mezcla orgs; genera resumen ejecutivo.

## Manual (humo)
- [ ] Navegación entre las 8 secciones.
- [ ] Filtros en socios / tareas / riesgo.
- [ ] Toasts en completar tarea, asignar coach, resolver alerta, copiar resumen.
- [ ] Estados loading/empty/error visibles.
- [ ] `npm run build` sin errores de tipos.
