# Migración de mock a base de datos real

## Qué cambió

Esta fase migró de una arquitectura con datos en memoria a persistencia real con PostgreSQL/Prisma, manteniendo la UI y la lógica de negocio intactas.

## Lo que NO cambió

- Componentes UI (`src/components/`)
- Páginas Next.js (`src/app/` — no routes)
- Motores de negocio (`activation-score`, `risk-engine`, `onboarding-engine`, `next-best-action`, `report-engine`)
- Sistema de permisos (`src/lib/permissions.ts`)
- Schemas Zod (`src/server/schemas/`)
- Tipos de dominio (`src/types/index.ts` — solo adiciones: `ruleKey`, nuevas `AuditAction`)
- Firmas de las funciones de servicio (mismos parámetros, ahora retornan `Promise<T>`)

## Lo que cambió

### Repositorios
Reemplazados completamente. Antes: `orgScope().members()` (in-memory). Ahora: `prisma.member.findMany({ where: { organizationId } })`. Misma interfaz pública, implementación diferente.

### Servicios
Todos los métodos son ahora `async`. Los servicios importan `new Date().toISOString()` en lugar de `nowISO()` de `@/data/store`.

### `tenant-scope.ts`
Eliminada la dependencia de `orgScope` (mock-db). Ahora es un módulo funcional puro que provee helpers para construir filtros de visibilidad. Los repositorios aplican estos filtros en sus queries Prisma.

### `auth.ts`
La implementación de `getRequestContext` tiene dos modos:
- `MOCK_AUTH=true`: comportamiento idéntico al anterior (lee `x-user-id` → lookup en mock)
- `MOCK_AUTH=false`: lee headers `x-f30-*` escritos por el middleware

### Route handlers (22 archivos)
Solo se añadió `await` antes de las llamadas a servicios. La firma `getRequestContext(req)` sigue siendo síncrona.

## Datos mock — ¿se eliminaron?

**No.** Los archivos `src/data/seed.ts`, `src/data/store.ts` y `src/data/mock-db.ts` se conservan como referencia. Con `MOCK_AUTH=true`, el sistema sigue usándolos para autenticación. Sin embargo, las operaciones de datos reales van a Prisma.

Para una limpieza completa (fuera del scope de esta fase): eliminar `src/data/` y actualizar `src/lib/auth.ts` para que no importe de ahí.

## Cómo probar la migración

### 1. Configurar variables de entorno
```bash
cp .env.example .env.local
# Editar .env.local con DATABASE_URL, DIRECT_URL, etc.
```

### 2. Ejecutar migración
```bash
npm run db:migrate
```

### 3. Ejecutar seed
```bash
npm run db:seed
```

### 4. Ejecutar la app
```bash
npm run dev
```

### 5. Probar endpoints en mock mode
```bash
# Con MOCK_AUTH=true
curl -H "x-user-id: usr_a_owner" http://localhost:3000/api/members
curl -H "x-user-id: usr_a_c2" http://localhost:3000/api/tasks
```

### 6. Verificar typecheck
```bash
npm run typecheck
```

## Problemas conocidos durante la migración

### `nowISO` importado desde `@/data/store`
Todos los servicios usaban `nowISO()` de `@/data/store`. Se reemplazó por `new Date().toISOString()`. Si algún servicio importa `nowISO`, necesita actualizarse.

### `scopedView` de `@/lib/tenant-scope`
Los servicios que aún llamen a `scopedView(ctx)` necesitan actualizarse para usar `getVisibilityFilters(ctx)` y `canSeeMember(ctx, ...)`.

### `orgScope` de `@/data/mock-db`
Los servicios que aún importen `orgScope` necesitan migrar a queries Prisma directas o usar repositorios.
