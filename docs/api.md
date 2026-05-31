# API

Respuesta estándar: `{ data: T | null, error: { code, message, details? } | null }`.
Tenant y actor vía cabeceras `x-user-id` (mock) → `getRequestContext`. Validación con Zod.

## Endpoints
### Members
- `GET /api/members` — filtros: status, riskLevel, coachId, search, onboardingMin/Max.
- `POST /api/members` — crea socio (Zod).
- `GET /api/members/[id]` — detalle base.
- `PATCH /api/members/[id]` — edición (Zod).
- `POST /api/members/[id]/assign-coach` — asigna coach (Zod).
- `POST /api/members/[id]/mark-contacted` — marca contactado.
- `GET /api/members/[id]/detail` — insight + actividad + mensajes + score + resumen IA.
- `GET|POST /api/members/[id]/notes` — notas internas (Zod en POST).

### Coaches
- `GET /api/coaches`, `GET /api/coaches/[id]`, `GET /api/coaches/[id]/today-members`.

### Tasks
- `GET /api/tasks` — filtros: status, priority, assignedTo.
- `POST /api/tasks` (Zod), `PATCH /api/tasks/[id]` (Zod), `POST /api/tasks/[id]/complete`.

### Alerts
- `GET /api/alerts` — filtros: riskLevel, status.
- `POST /api/alerts/[id]/resolve`, `POST /api/alerts/[id]/snooze` (Zod).

### Messages
- `GET /api/messages/templates`, `POST /api/messages/copy` (Zod), `POST /api/messages/log` (Zod).

### Reports & audit
- `GET /api/reports/weekly`, `GET /api/reports/weekly/advanced`, `POST /api/reports/weekly/generate`.
- `GET /api/audit` — eventos recientes.

### Settings
- `GET /api/settings`, `PATCH /api/settings` (Zod, solo owner), `PATCH /api/settings/risk-rules` (Zod, solo owner).

## Códigos de error
`VALIDATION_ERROR` (422), `NOT_FOUND` (404), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
`CONFLICT`/`RULE_VIOLATION` (409), `INTERNAL` (500).
