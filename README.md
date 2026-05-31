# First30 — App shell (Fase 1)

SaaS B2B interno para ordenar los primeros 30 días de cada nuevo socio de un box.
Esta fase entrega la **base navegable**: shell de aplicación, navegación e 8 pantallas
reales con cabeceras y contenido placeholder de calidad. Sin backend ni lógica de negocio aún.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS con tokens de diseño propios (estética Linear/Attio/Vercel)
- lucide-react para iconografía

## Arranque
```bash
npm install
npm run dev      # http://localhost:3000  (/ redirige a /dashboard)
npm run build    # build de producción (validado)
```

## Estructura
- `src/app/*` — una página real por sección (App Router).
- `src/components/layout/*` — AppShell, Sidebar, Topbar, MobileNav (+ Brand, NavLinks).
- `src/components/ui/*` — Badge, Card, Button, PageHeader, EmptyState, ErrorState, LoadingState, PlaceholderPanel.
- `src/lib/*` — navigation.ts (fuente única de la navegación) y utils.ts (cn, pct).

## Convenciones
- Páginas = server components que solo componen UI.
- Interactividad (nav activa, menú móvil) aislada en componentes `"use client"`.
- Colores vía tokens de Tailwind (`accent`, `danger`, `muted`…), sin estilos inline.

## Backend / API (Fase 3)
Arquitectura en capas: **route handler → service → repository → store (mock-db)**.
- `src/app/api/**` — 20 route handlers (Next App Router).
- `src/server/services/**` — lógica de negocio y reglas de coherencia.
- `src/server/repositories/**` — acceso a datos scoped por `organizationId`.
- `src/server/schemas/**` — validación Zod en los bordes.
- `src/lib/{api-response,errors,tenant}.ts` — respuesta estándar, errores y tenant.
- `src/lib/api/*` + `src/examples/MembersExample.tsx` — cliente tipado y ejemplo de pantalla.

Respuesta estándar: `{ data: T | null, error: { code, message, details? } | null }`.
El tenant se deriva en `resolveOrgId` (cabecera `x-organization-id` o query; por defecto `org_centro`).

Pruebas:
```bash
npx tsx scripts/validate-seed.ts   # coherencia del seed (26 checks)
npx tsx scripts/test-api.ts        # integración de los 20 endpoints (25 checks)
npm run build                      # tipos + 20 rutas dinámicas
```

## Motores de negocio (Fase 4)
Lógica central pura, sin React ni queries, en `src/lib/`:
- `engine-input.ts` — `MemberContext`, la entrada común que reciben los motores.
- `activation-score.ts` — Activation Score 0–100 + clasificación de riesgo.
- `risk-engine.ts` — 6 reglas de riesgo → `RiskFinding[]`.
- `onboarding-engine.ts` — estado derivado (auto) con override manual.
- `next-best-action.ts` — la siguiente mejor acción por socio.

`src/server/services/insight.service.ts` carga el `MemberContext` desde los
repositorios (scoped por organización) y expone los motores a la UI; los
componentes nunca arman el contexto ni tocan el seed.

Componentes conectados (`src/components/ui/`): `ActivationScoreCard`,
`RiskReasonPanel`, `SuggestedNextBestAction`. Integrados en `/dashboard`,
`/risk` y la nueva ficha `/members/[id]`.

Pruebas:
```bash
npx tsx scripts/test-engines.ts    # reglas, score, estado, NBA (25 checks)
```

## RBAC + Multi-tenant (Fase 5)
- `src/lib/auth.ts` — auth mock: `CurrentUser`, `RequestContext`, `getRequestContext(req)`.
  El `organizationId` SIEMPRE sale del usuario autenticado (no de un parámetro manipulable).
- `src/lib/permissions.ts` — matriz RBAC por rol + `can(user, action, resource)` y `assertCan`.
- `src/lib/tenant-scope.ts` — `scopedView(ctx)`: aislamiento por org + visibilidad por rol
  (coach solo ve sus socios / sus tareas / alertas de sus socios).

Todos los servicios reciben `RequestContext`, comprueban permiso con `assertCan` y
operan sobre datos scoped. Los route handlers derivan el contexto con `getRequestContext`.

Roles: **owner** (todo + settings), **manager** (todo salvo settings.update),
**coach** (solo sus socios/tareas/mensajes; sin settings ni report.generate).

Pruebas:
```bash
npx tsx scripts/test-permissions.ts   # 8 escenarios RBAC + multi-tenant
```

## UX avanzada (Fase 6)
Estados loading/empty/error/success en todas las listas; feedback con toasts.
- `src/components/ui/ToastProvider.tsx` — provider + `useToast()` (success/error/info), montado en el layout.
- `src/hooks/useAsync.ts` — carga con estados loading/error/data y recarga.
- Filtros: `FilterChips`, `SearchInput`. Vistas cliente:
  `components/members/MembersView.tsx` (búsqueda + estado/riesgo/coach/día),
  `components/tasks/TasksView.tsx` (prioridad/responsable + completar con feedback),
  `components/risk/RiskView.tsx` (severidad/motivo + resolver/posponer).
- Ficha enriquecida `components/members/MemberDetailView.tsx` con:
  `ActivationScoreCard`, `RiskReasonPanel`, `SuggestedNextBestAction`, `AiSummaryCard`,
  `ActivityFeed`, `MessageHistory`, `InternalNotes`, `ScoreTrend`, `AuditLog`.
- Endpoints nuevos: `GET /api/members/[id]/detail`, `GET|POST /api/members/[id]/notes`.

Pruebas:
```bash
npx tsx scripts/test-detail.ts   # detalle + notas (5 checks)
```

## Informe avanzado + Audit log (Fase 7)
- `src/lib/report-engine.ts` — motor puro: métricas, comparación vs semana anterior,
  distribución por coach, riesgos abiertos/resueltos, recomendaciones, 2 resúmenes.
- `src/components/reports/` — `WeeklyReport`, `ReportMetricCard`, `CoachDistribution`, `ReportSummaryBlock`.
- `src/components/audit/AuditLog.tsx` — eventos recientes (actor, acción, entidad, fecha, metadata).
- Endpoints: `GET /api/reports/weekly/advanced`, `GET /api/audit`.
- Owner/manager ven el informe completo; coach un digest de sus socios.

## Tests, hardening y documentación (Fase 8)
- `scripts/test-all.ts` — corre las 6 suites. `scripts/test-reports.ts` — report-engine (17 checks).
- Documentación en `docs/`: product-overview, architecture, data-model, permissions,
  risk-engine, api, qa-checklist, roadmap.

## Ejecutar todo
```bash
npm install
npm run build              # tipos + 22 rutas
npx tsx scripts/test-all.ts # 6 suites
npm run dev                # http://localhost:3000
```

## Sistema de temas (claro/oscuro/sistema)
- `next-themes` con `attribute="class"`, `defaultTheme="system"`, `enableSystem`.
- `src/components/theme/theme-provider.tsx` montado en el layout (con `suppressHydrationWarning`).
- `src/components/theme/appearance-selector.tsx` — segmented control accesible (radiogroup).
  Acceso rápido compacto en el Topbar y sección "Aspecto" en Configuración (`appearance-setting.tsx`).
- Tokens en `globals.css`: `:root` (claro) y `.dark` (oscuro elegante, zinc profundo).
  `tailwind.config.ts` con `darkMode: "class"` y colores apuntando a `var(--token)`.
  Las clases existentes (`bg-surface`, `text-muted`, `border-border`…) ya son temáticas.

Probar: cambiar el selector (Topbar o Configuración → Aspecto); recargar mantiene la
preferencia; "Sistema" sigue el SO. `npm run dev`.
