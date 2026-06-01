# Row Level Security (RLS) — First30

## Estado de la implementación

Las políticas RLS están definidas en `supabase/migrations/20260531000000_enable_rls.sql`.

## LIMITACIÓN CRÍTICA — Lee esto antes de confiar en RLS

**Prisma bypassa RLS completamente.**

Prisma se conecta a PostgreSQL usando `DATABASE_URL`, que contiene credenciales de servicio (service role o superuser). Postgres aplica RLS solo cuando la sesión tiene un JWT de usuario configurado via `SET LOCAL request.jwt.claims = '...'`. Prisma no hace esto.

### ¿Qué protege RLS en este proyecto?

RLS protege **accesos directos desde Supabase JS client** (browser):

```typescript
// Si en el futuro se añade acceso directo desde browser:
const supabase = createBrowserClient(url, anonKey)
await supabase.from('members').select() // → RLS aplicado: solo ve su org
```

### ¿Qué NO protege RLS?

Todos los accesos a través de Prisma (que es el 100% del backend actual):

```typescript
// Esto bypassa RLS — la seguridad la garantiza el código:
await prisma.member.findMany({ where: { organizationId: orgId } })
```

## ¿Dónde está la protección real multi-tenant?

La protección real viene de 3 capas:

### Capa 1 — Middleware (más externa)
El `middleware.ts` verifica la sesión Supabase y escribe el `organizationId` derivado del usuario autenticado en un header interno. El cliente nunca puede inyectar un `organizationId` arbitrario.

### Capa 2 — Repositorios (queries)
Todos los repositorios tienen `organizationId` como condición obligatoria en TODAS las queries:
```typescript
prisma.member.findMany({ where: { organizationId: orgId, ... } })
```
No existe ninguna query sin `organizationId`.

### Capa 3 — Servicios (permisos)
Los servicios validan permisos con `assertCan()` antes de cualquier operación y usan `getVisibilityFilters()` para añadir filtros de coach cuando el usuario tiene rol `coach`.

## Aplicar las políticas RLS

```bash
# En Supabase SQL Editor, ejecutar el contenido de:
supabase/migrations/20260531000000_enable_rls.sql

# O usando Supabase CLI:
supabase db push
```

## Función helper en Postgres

```sql
-- Obtiene el organizationId del usuario autenticado vía JWT
CREATE FUNCTION first30_org_id() RETURNS TEXT AS $$
  SELECT organization_id FROM users WHERE supabase_uid = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql STABLE;
```

## Política de seguridad recomendada

| Acceso | Protección |
|--------|-----------|
| Prisma (backend) | Repositorios + Middleware (NO RLS) |
| Supabase JS client (browser) | RLS + Anon key |
| Supabase Admin (service role) | Sin restricciones — usar solo en servidor |

## Verificar que RLS está activo

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Todas las tablas tenant-scoped deben tener `rowsecurity = true`.
