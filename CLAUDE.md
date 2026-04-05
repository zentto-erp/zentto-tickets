# Zentto Tickets — Claude Code

## Idioma

- Toda la salida debe ser en **español**.
- Nombres de variables, funciones y código se mantienen en inglés.

## Descripción

Sistema de ticketing y eventos con mapas interactivos de asientos.
Parte del ecosistema **Zentto ERP** — reutiliza auth, datagrid y report engine.

## Estructura

| Componente | Ruta | Stack |
|------------|------|-------|
| API | `api/` | Node + Express + TypeScript |
| Frontend | `frontend/` | Next.js 16 + React 19 |
| Migraciones | `migrations/postgres/` | Goose (PostgreSQL) |
| SQL Server | `sql/mssql/` | T-SQL (dual database) |

## Stack técnico

- **Seat Map Renderer**: Konva.js (react-konva) — Canvas para miles de asientos
- **Venue Editor**: Fabric.js — diseñador visual drag & drop
- **Tiempo real**: WebSocket + Redis pub/sub para disponibilidad de asientos
- **Auth**: JWT compartido con zentto-web API (mismo JWT_SECRET)
- **Pagos**: Paddle (reutiliza infra Zentto)
- **QR Tickets**: qrcode + HMAC para validación offline-first

## Schema de BD

- Schema PostgreSQL: `tkt`
- Tablas: venue, venue_configuration, section, row, seat, event, pricing_zone, event_inventory, order, ticket, event_ga_inventory

## Reglas

- Siempre parametrizar queries SQL
- Todo cambio de BD va como migración goose en `migrations/postgres/`
- SP naming: `usp_tkt_[Entity]_[Action]`
- No versionar secretos
- Fechas en UTC-0
- Nunca `git push` sin confirmación
