<p align="center">
  <img src="https://zentto.net/favicon.svg" width="64" alt="Zentto Logo" />
</p>

<h1 align="center">Zentto Tickets</h1>

<p align="center">
  <strong>Sistema de ticketing, eventos y experiencias con mapas interactivos de asientos y carreras de calle.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/stack-Node%20%7C%20Next.js%20%7C%20PostgreSQL-blue" alt="Stack" />
  <img src="https://img.shields.io/badge/api-:4700-orange" alt="API port" />
  <img src="https://img.shields.io/badge/web-:3300-orange" alt="Web port" />
  <img src="https://img.shields.io/badge/schema-tkt-336791" alt="PG schema" />
  <img src="https://img.shields.io/badge/license-proprietary-lightgrey" alt="License" />
</p>

<p align="center">
  <a href="#arquitectura">Arquitectura</a> ·
  <a href="#modulos">Módulos</a> ·
  <a href="#desarrollo-local">Desarrollo local</a> ·
  <a href="#api-endpoints">API</a> ·
  <a href="#ecosistema-zentto">Ecosistema</a>
</p>

---

Sistema de ticketing, eventos y experiencias integrado al ecosistema **Zentto ERP**.

Gestiona venues, eventos, venta de boletos con mapas interactivos de asientos, carreras de calle (5K, 10K, maratones), inscripciones, dorsales, control de tiempos y escaneo QR en puerta.

## Arquitectura

```
zentto-tickets/
├── api/                          # API REST — Node + Express + TypeScript
│   ├── src/
│   │   ├── auth/                 # JWT (valida tokens de zentto-web)
│   │   ├── middleware/           # Auth, CORS
│   │   ├── db/                   # Pool PostgreSQL
│   │   ├── modules/
│   │   │   ├── venues/           # CRUD venues, configs, secciones, asientos
│   │   │   ├── events/           # CRUD eventos, pricing, inventario, hold/release
│   │   │   ├── orders/           # Checkout, pagos, tickets QR
│   │   │   ├── races/            # Carreras, categorías, inscripciones, tiempos
│   │   │   └── scan/             # Validación QR en puerta (HMAC anti-fraude)
│   │   ├── ws/                   # WebSocket — disponibilidad en tiempo real
│   │   └── jobs/                 # Hold cleanup (30s cron)
│   └── package.json
├── frontend/                     # Next.js 16 + React 19 + MUI 6
│   ├── src/
│   │   ├── app/                  # Pages (App Router)
│   │   ├── components/
│   │   │   ├── SeatMap/          # Konva.js — mapa interactivo de asientos
│   │   │   └── VenueEditor/      # Fabric.js — editor visual de venues
│   │   ├── hooks/                # React Query hooks
│   │   ├── lib/                  # API client
│   │   └── types/                # TypeScript types
│   └── package.json
├── migrations/
│   └── postgres/                 # Goose migrations (schema tkt)
├── docker/                       # Dockerfiles (API + Frontend)
├── .github/workflows/            # CI/CD deploy
└── docker-compose.yml            # Dev local (PG + Redis)
```

## Stack

| Capa | Tecnología |
|------|-----------|
| API | Node.js 20, Express 4, TypeScript 5 |
| Frontend | Next.js 16, React 19, MUI 6 |
| Seat Map | Konva.js (Canvas) — render miles de asientos |
| Venue Editor | Fabric.js — diseño visual drag & drop |
| Base de datos | PostgreSQL 16 (schema `tkt`) |
| Cache / Pub-Sub | Redis 7 |
| Tiempo real | WebSocket nativo |
| Auth | JWT compartido con zentto-web API |
| QR Tickets | qrcode + HMAC-SHA256 |
| Deploy | Docker + GitHub Actions + ghcr.io |

## Puertos

| Servicio | Produccion | Dev |
|----------|-----------|-----|
| API | 4700 | 4710 |
| Frontend | 3300 | 3310 |
| WebSocket | 4701 | 4711 |

## URLs de produccion

| Servicio | URL |
|----------|-----|
| Frontend | `https://tickets.zentto.net` |
| API | `https://tickets-api.zentto.net` |
| Dev Frontend | `https://ticketsdev.zentto.net` |
| Dev API | `https://ticketsapidev.zentto.net` |

## Modulos

### Venues
Estadios, arenas, teatros. Editor visual con Fabric.js para diseñar secciones.
Generacion automatica de asientos (filas x asientos por fila).

**Venues seed incluidos:** Estadio Monumental Simon Bolivar, UCV, Bernabeu, Camp Nou, Dodger Stadium y 10 mas.

### Eventos
Conciertos, partidos, festivales. Pricing zones por evento (VIP, Preferencial, General).
Inventario de asientos con hold temporal (10 min) y liberacion automatica.

### Boletos
Checkout con QR code (HMAC anti-fraude). Scanner en puerta con validacion offline-first.
Deteccion de tickets duplicados, cancelados o manipulados.

### Carreras
5K, 10K, 21K, 42K, ultra-trail. Inscripciones con dorsal automatico.
Categorias por edad/genero. Control de tiempos (chip + oficial). Clasificacion en tiempo real.

## Base de datos

Schema PostgreSQL: `tkt`

**Migraciones goose:**
- `00001_ticketing_schema.sql` — 13 tablas (venue, section, seat, event, pricing, inventory, order, ticket)
- `00002_races_schema.sql` — 3 tablas (race, race_category, race_registration)

## Auth

Consume el microservicio de autenticacion de **zentto-web** (mismo `JWT_SECRET`).
El login en el frontend usa NextAuth contra `POST /v1/auth/login` de la API principal.

Headers automaticos: `Authorization`, `x-company-id`, `x-branch-id`, `x-timezone`.

## CI/CD

| Rama | Imagen | Destino |
|------|--------|---------|
| `main` | `:latest` | Produccion |
| `developer` | `:dev` | Dev |

Push a `main` o `developer` → GitHub Actions → build Docker → push ghcr.io → SSH deploy al servidor.

Infraestructura gestionada por [zentto-infra](https://github.com/zentto-erp/zentto-infra).

## Desarrollo local

```bash
# 1. Clonar
git clone https://github.com/zentto-erp/zentto-tickets.git
cd zentto-tickets

# 2. Configurar
cp .env.example .env
# Editar .env con credenciales locales

# 3. Levantar BD + Redis
docker compose up postgres redis -d

# 4. Correr migraciones
goose -dir migrations/postgres postgres "host=localhost port=5433 user=postgres password=tickets123 dbname=zentto_tickets sslmode=disable" up

# 5. Instalar dependencias
npm install

# 6. Iniciar API + Frontend
npm run dev
# API: http://localhost:4700
# Frontend: http://localhost:3300
```

## API Endpoints

### Venues (`/v1/venues`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/` | Listar venues |
| GET | `/:id` | Obtener venue |
| POST | `/` | Crear venue (admin) |
| PUT | `/:id` | Actualizar venue (admin) |
| GET | `/:id/configurations` | Configuraciones del venue |
| POST | `/:id/configurations` | Crear configuracion (admin) |
| GET | `/configurations/:id/sections` | Secciones de una config |
| GET | `/configurations/:id/seatmap` | Mapa completo de asientos |
| POST | `/sections/:id/generate-seats` | Generar asientos (admin) |

### Eventos (`/v1/events`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/` | Listar eventos |
| GET | `/:id` | Obtener evento |
| POST | `/` | Crear evento (admin) |
| PUT | `/:id` | Actualizar evento (admin) |
| GET | `/:id/pricing-zones` | Zonas de precio |
| POST | `/:id/initialize-inventory` | Inicializar inventario (admin) |
| GET | `/:id/availability` | Disponibilidad de asientos |
| POST | `/:id/hold` | Reservar asientos (10 min) |
| POST | `/:id/release` | Liberar asientos |

### Ordenes (`/v1/orders`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/` | Mis ordenes |
| GET | `/:id` | Detalle de orden |
| POST | `/checkout` | Comprar (seats held → tickets) |
| POST | `/:id/confirm-payment` | Confirmar pago |
| POST | `/:id/cancel` | Cancelar orden |
| GET | `/:id/tickets` | Tickets con QR |

### Carreras (`/v1/races`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/` | Listar carreras |
| GET | `/:id` | Detalle de carrera |
| POST | `/` | Crear carrera (admin) |
| GET | `/:id/categories` | Categorias |
| POST | `/:id/register` | Inscribirse |
| GET | `/:id/registrations` | Inscritos |
| GET | `/:id/results` | Clasificacion |
| POST | `/registrations/:id/finish` | Registrar llegada |

### Scan (`/v1/scan`)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/validate` | Validar QR de boleto |

## Ecosistema Zentto

Este repositorio forma parte del ecosistema **Zentto**:

| Repo | Descripcion |
|------|-------------|
| [`zentto-web`](https://github.com/zentto-erp/zentto-web) | Core ERP y auth JWT compartido |
| [`zentto-infra`](https://github.com/zentto-erp/zentto-infra) | Infra compartida (Postgres, Redis, Nginx) |
| [`zentto-notify`](https://github.com/zentto-erp/zentto-notify) | Notificaciones (email/SMS de boletos) |
| [`zentto-report`](https://github.com/zentto-erp/zentto-report) | Motor de reportes y boletos PDF |
| [`zentto-erp-docs`](https://github.com/zentto-erp/zentto-erp-docs) | Documentacion oficial |

## Convenciones

- **Branch desde `developer`**, PR a `developer`, merge final a `main`.
- **Commits** sin coautores automaticos.
- **Migraciones**: goose en `migrations/postgres/` — nunca editar SPs en caliente.
- **UI**: tablas con `<zentto-grid>` (nunca `<table>` HTML nativo).

## Licencia

Privado — Zentto ERP. Todos los derechos reservados.

---

<p align="center">
  Hecho con cariño por el equipo <a href="https://zentto.net">Zentto</a>
</p>
