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
