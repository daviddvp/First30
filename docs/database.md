# Base de datos — First30

## Stack

- **ORM**: Prisma 5.x
- **DB**: PostgreSQL (vía Supabase)
- **Schema**: `prisma/schema.prisma`
- **Seed**: `prisma/seed.ts`

## Entidades

| Modelo | Tenant-scoped | Descripción |
|--------|--------------|-------------|
| Organization | — | Gym/box. Raíz del árbol multi-tenant. |
| User | ✓ | Usuarios internos (owner, manager, coach). Tiene `supabaseUid` para vincular con Supabase Auth. |
| CoachProfile | ✓ | Perfil extendido de coach. Separado de User para separar auth de datos de negocio. |
| Member | ✓ | Socio en onboarding (primeros 30 días). |
| Attendance | ✓ | Asistencia a clase. |
| CheckIn | ✓ | Check-in de seguimiento coach→socio. |
| Task | ✓ | Tarea operativa (manual o generada por job). |
| RiskAlert | ✓ | Alerta de riesgo (manual o generada por job). |
| MessageTemplate | ✓ | Plantilla de mensaje predefinida. |
| MessageLog | ✓ | Log de mensajes copiados/enviados. |
| OnboardingRule | ✓ | Configuración de reglas por organización. |
| WeeklyReport | ✓ | Informe semanal generado. |
| AuditLog | ✓ | Eventos de auditoría. |
| Note | ✓ | Notas internas de coach sobre un socio. |
| OrgSettings | ✓ | Configuración de umbrales de riesgo por organización. |

## Deduplicación del job (ruleKey)

`Task` y `RiskAlert` tienen un campo `ruleKey` (nullable). El job usa este campo para garantizar idempotencia:

```
ruleKey = "{orgId}:{ruleType}:{memberId}"
Ejemplo: "org_centro:no_return_7d:mbr_marta"
```

Antes de crear una alerta o tarea, el job busca una abierta con el mismo `ruleKey`. Si existe, no crea duplicado.

## Índices clave

Los índices están definidos en `schema.prisma`. Los más importantes:
- `Member`: `(organizationId)`, `(assignedCoachId)`, `(status)`, `(riskLevel)`, `(organizationId, status)`
- `Task`: `(organizationId)`, `(status)`, `(ruleKey)`, `(memberId)`
- `RiskAlert`: `(organizationId)`, `(status)`, `(ruleKey)`, `(memberId)`
- `Attendance`: `(memberId)`, `(organizationId)`
- `CheckIn`: `(memberId)`, `(organizationId)`

## Comandos útiles

```bash
# Generar el cliente Prisma (necesario después de cambiar el schema)
npm run db:generate

# Crear una nueva migración (entorno de desarrollo)
npm run db:migrate
# o con nombre descriptivo:
npx prisma migrate dev --name "add-field-x"

# Aplicar schema sin migración (solo para desarrollo rápido)
npm run db:push

# Ejecutar el seed
npm run db:seed

# Abrir Prisma Studio (GUI para la DB)
npm run db:studio

# Reset completo (borra todos los datos y re-aplica migraciones + seed)
npm run db:reset
```

## Configuración de conexión Supabase

Supabase usa PgBouncer para el pooling. Requiere dos URLs:
- `DATABASE_URL`: pooler en modo Transaction (puerto 6543). Prisma la usa para queries.
- `DIRECT_URL`: conexión directa (puerto 5432). Prisma la usa para `migrate dev`.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## Tipos: Prisma vs dominio

Prisma devuelve `Date` para campos de fecha. Los servicios y motores de negocio usan `ISODate = string`. Los **repositorios** contienen mappers que convierten `Date → string.toISOString()`. Los servicios y UI nunca ven tipos Prisma directamente.
