# Arquitectura

Next.js 14 (App Router) + TypeScript + Tailwind. Capas estrictas; la lógica de negocio
vive fuera de la UI.

## Capas (de fuera a dentro)
1. **UI / pantallas** (`src/app/**`, `src/components/**`): server components que componen
   y client components para interacción. No contienen lógica de negocio ni tocan el seed.
2. **API / route handlers** (`src/app/api/**`): derivan el `RequestContext`, validan con
   Zod y delegan en servicios. Respuesta estándar `{ data, error }`.
3. **Servicios** (`src/server/services/**`): lógica de negocio, permisos (`assertCan`) y
   orquestación. Reciben `RequestContext`.
4. **Motores puros** (`src/lib/*-engine.ts`, `activation-score.ts`, `next-best-action.ts`):
   funciones puras sin React ni queries; reciben datos y devuelven resultados.
5. **Repositorios** (`src/server/repositories/**`): acceso a datos, siempre scoped por
   `organizationId`.
6. **Almacén** (`src/data/store.ts` sobre `seed.ts`): dataset mutable en memoria.
   Reemplazable por Prisma/Supabase sin tocar capas superiores.

## Flujo de una petición
`route handler` → `getRequestContext(req)` → `Zod.parse` → `service.method(ctx, input)` →
`assertCan` + `scopedView` → `repository` → `store`.

## Multi-tenant
Todo dato cuelga de `organizationId`. `orgScope(orgId)` y `scopedView(ctx)` garantizan que
ninguna consulta devuelve datos de otra organización. Ver `permissions.md`.

## Nota sobre `insight.service`
Recibe `orgId` directo (no `RequestContext`) por ser lectura interna scoped. Sus llamadores
(`member-detail.service`, server components) ya garantizan el control de acceso antes de invocarlo.

## Estado / UX
`useAsync` para estados loading/error/data; `ToastProvider` para feedback success/error/info.
