# Vexa

Monorepo NX de la plataforma de entregas de última milla.

## Estructura

```
apps/
  api-gateway        NestJS — REST API, auth OAuth2+JWT, TypeORM/PostGIS, R2, pagos (Wompi/Stripe)
  realtime-service   NestJS — Socket.IO (namespace /realtime) + adaptador Redis
  matching-service   NestJS — matching repartidor↔pedido con Redis GEO (3 km)
  web-landing        Angular 22 + Material — shell de Module Federation (login + enrutamiento por rol)
  web-company        Angular 22 + Material — portal de empresas (remote federado)
  web-admin          Angular 22 + Material — panel de administración (remote federado)
  web-courier        Angular 22 + Material — panel de mensajeros (remote federado)
  mobile-courier     Flutter — app del repartidor (GPS, tracking, FCM; corre en Android/iOS/Chrome)
libs/
  shared             Enums, modelos y eventos de socket compartidos
  core               Redis (ioredis, GEO, pub/sub), telemetría OTEL, health
  auth               Passport/JWT, guards, decoradores, estrategias OAuth
  notifications      Firebase Cloud Messaging
  payments           Puerto/adaptadores: Wompi, Stripe Connect (stub)
  ui                 Componentes Material compartidos (shell, chips, header)
  maps               Wrapper Mapbox GL para Angular
  web-core           Infraestructura Angular compartida entre los 4 frontends (interceptor de auth/refresh)
```

## Requisitos

- Node 22 (`.nvmrc`), npm 10
- Flutter 3.2x para `mobile-courier`
- Docker Desktop para la infraestructura local

## Arranque rápido

```powershell
nvm use
npm ci
docker compose up -d postgres redis
cp .env.example .env   # rellena secretos de OAuth/R2/FCM/Wompi
```

Guía completa paso a paso (infraestructura, los 3 servicios backend, los 4 frontends Angular y la app Flutter en Chrome): [docs/LEVANTAR_AMBIENTE_LOCAL.md](docs/LEVANTAR_AMBIENTE_LOCAL.md)

Servicios (cada uno en una terminal):

```powershell
npx nx serve api-gateway        # http://localhost:3000/api — Swagger en /api/docs
npx nx serve realtime-service   # ws://localhost:3001/realtime
npx nx serve matching-service   # http://localhost:3002
npx nx serve web-landing        # http://localhost:4400 — shell, ábrelo en el navegador
npx nx serve web-company        # http://localhost:4200
npx nx serve web-admin          # http://localhost:4300
npx nx serve web-courier        # http://localhost:4401
cd apps/mobile-courier; flutter run -d chrome
```

Observabilidad local: `docker compose up -d otel-collector jaeger prometheus grafana`
→ Jaeger :16686 · Prometheus :9090 · Grafana :3100 (admin/admin).

## Flujo en tiempo real

```
POST /api/jobs  ──► Redis pub/sub (jobs.created)
                       │
              matching-service ──► GEOSEARCH couriers ≤3 km
                       │            pub/sub (jobs.offered)
                       ▼
              realtime-service ──► Socket.IO NEW_JOB → courier:* rooms
```

Eventos: `NEW_JOB`, `JOB_ACCEPTED`, `JOB_CANCELLED`, `COURIER_LOCATION`, `JOB_COMPLETED`
(definidos en `@vexa/shared`).

## Verificación

```powershell
npx nx run-many -t build lint test --all
npx nx run mobile-courier:analyze
```

CI en `.github/workflows/ci.yml` (NX affected + Flutter analyze/test).
