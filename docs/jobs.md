# Jobs de reglas — First30

## Descripción

El job `run-onboarding-rules` detecta socios en riesgo y persiste alertas y tareas de forma automática. Cierra el ciclo: `detectar → recomendar → actuar → registrar`.

## Endpoint

```
POST /api/jobs/run-onboarding-rules
Authorization: Bearer <JOB_SECRET>
```

Query params opcionales:
- `?orgId=org_centro` — Procesar solo una organización

## Idempotencia

El job usa `ruleKey` como clave lógica de deduplicación:

```
ruleKey = "{orgId}:{ruleType}:{memberId}"
```

Antes de crear cualquier alerta o tarea, el job busca una existente con el mismo `ruleKey` y estado abierto. Si existe, no crea duplicado. El job puede ejecutarse múltiples veces al día sin efectos secundarios.

## Reglas implementadas

| Regla | Trigger | Tipo de acción |
|-------|---------|---------------|
| `no_return_7d` | Sin asistencia en N días (configurable, default 7) | Alerta HIGH + Tarea |
| `low_attendance_14d` | Menos de N asistencias en 14 días (default 2) | Alerta MEDIUM |
| `no_coach` | Sin coach asignado | Tarea HIGH |
| `checkin_no_response` | Check-in enviado sin respuesta | Alerta MEDIUM |
| `injury_no_adaptation` | Limitación sin tarea de adaptación | Tarea MEDIUM |
| Recálculo score | Siempre | Actualizar `activationScore` + `status` |

## Configuración de umbrales

Los umbrales se guardan en `OrgSettings` y en `OnboardingRule`. Cada organización puede tener sus propios valores.

## Ejecución manual

```bash
# Desarrollo (con MOCK_AUTH=true, en otro terminal)
npm run dev

# Ejecutar el job para todas las orgs
curl -X POST http://localhost:3000/api/jobs/run-onboarding-rules \
  -H "Authorization: Bearer tu_job_secret_aqui"

# Ejecutar solo para una org
curl -X POST "http://localhost:3000/api/jobs/run-onboarding-rules?orgId=org_centro" \
  -H "Authorization: Bearer tu_job_secret_aqui"
```

## Configurar Vercel Cron

Para ejecutar automáticamente cada día a las 8:00 AM, añadir `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/jobs/run-onboarding-rules",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Y en Vercel, configurar la variable `JOB_SECRET`. Vercel enviará el header `Authorization: Bearer <value>` automáticamente.

## Response

```json
{
  "data": {
    "orgsProcessed": 2,
    "totalMembersProcessed": 12,
    "totalAlertsCreated": 3,
    "totalTasksCreated": 2,
    "totalScoresUpdated": 5,
    "totalErrors": 0,
    "results": [...],
    "executedAt": "2026-05-31T08:00:00.000Z"
  },
  "error": null
}
```

HTTP 200 → todo OK  
HTTP 207 → procesado con algunos errores (ver `results[].errors`)  
HTTP 401 → secret inválido

## Audit log

El job registra cada ejecución en `AuditLog` con `action = "job_run"` y metadatos de la ejecución.

## Tests

```bash
# Requiere DB configurada y seed ejecutado
MOCK_AUTH=false npx tsx scripts/test-job.ts
```
