# Levantar el ambiente local — Vexa

Guía para levantar todo el monorepo en local: infraestructura, backend (NestJS) y frontends (Angular + Flutter).

## Requisitos previos

- Node.js + npm (dependencias ya instaladas con `npm install` en la raíz del repo)
- Docker Desktop corriendo (para Postgres/Redis/observabilidad)
- Flutter SDK instalado y con Chrome como dispositivo disponible (`flutter devices` debe listar `Chrome`)
- Variables de entorno configuradas:
  - Raíz del repo: `.env` (copiar desde [.env.example](../.env.example) la primera vez)
  - `apps/mobile-courier/.env` (copiar desde [apps/mobile-courier/.env.example](../apps/mobile-courier/.env.example) la primera vez)

## 1. Infraestructura (Postgres, Redis, observabilidad)

```bash
npm run dev:infra
```

Levanta en Docker: `postgres` (5432), `redis` (6379), `otel-collector` (4318), `jaeger` (16686), `prometheus` (9090) y `grafana` (3100).

Primera vez / base de datos vacía — sembrar datos de prueba:

```bash
node tools/db/seed_full.js
```

## 2. Backend — 3 servicios NestJS

Cada uno en su propia terminal:

```bash
npx nx serve api-gateway
```

```bash
npx nx serve realtime-service
```

```bash
npx nx serve matching-service
```

| Servicio | Puerto |
|---|---|
| api-gateway | 3000 |
| realtime-service | 3001 |
| matching-service | 3002 |

## 3. Frontends — 4 apps Angular (Module Federation)

Cada uno en su propia terminal:

```bash
npx nx serve web-company
```

```bash
npx nx serve web-admin
```

```bash
npx nx serve web-courier
```

```bash
npx nx serve web-landing
```

| App | Puerto | Rol |
|---|---|---|
| web-company | 4200 | Remote (federado) |
| web-admin | 4300 | Remote (federado) |
| web-courier | 4401 | Remote (federado) |
| web-landing | 4400 | **Shell** — es el que se abre en el navegador |

`web-landing` es el shell: consume a company/admin/courier en tiempo real vía Module Federation, por lo que deben estar corriendo los tres remotes para que sus rutas carguen. La app se abre en **http://localhost:4400**.

Usa `nx serve` (no `nx serve-static`) para tener recarga en vivo — `serve-static` hace un build de producción una sola vez y sirve el `dist/` estático, sin watch.

### Atajo: todo el backend + frontends en una sola terminal

```bash
npx nx run-many -t serve -p api-gateway realtime-service matching-service web-company web-admin web-courier web-landing --parallel=7
```

(los logs de los 7 procesos quedan intercalados en la misma terminal; para desarrollo día a día suele ser más cómodo tener una terminal por servicio)

## 4. App móvil (Flutter) en Chrome

```bash
cd apps/mobile-courier
flutter pub get
flutter run -d chrome --web-port=5000
```

Requiere que `api-gateway` (3000) y `realtime-service` (3001) ya estén corriendo — el `.env` de `mobile-courier` apunta a `http://localhost:3000/api` y `http://localhost:3001`.

> Nota: el valor por defecto en [env.dart](../apps/mobile-courier/lib/core/config/env.dart) (`10.0.2.2`) es el alias del emulador Android hacia el host, y **no funciona en Chrome**. El `.env` del proyecto ya está configurado con `localhost` para desarrollo web/desktop.

> **CORS**: `api-gateway` solo acepta peticiones desde los orígenes listados en `CORS_ORIGINS` (raíz del repo, `.env`). Flutter Web levanta su dev server en un puerto aleatorio en cada corrida, así que hay que fijarlo con `--web-port=5000` (como arriba) — el `.env.example`/`.env` ya incluyen `http://localhost:5000` en `CORS_ORIGINS` para que coincida. Si usas otro puerto, agrégalo a esa variable y reinicia `api-gateway`.

## Resumen de puertos

| Servicio | Puerto |
|---|---|
| postgres | 5432 |
| redis | 6379 |
| otel-collector | 4318 |
| jaeger | 16686 |
| prometheus | 9090 |
| grafana | 3100 |
| api-gateway | 3000 |
| realtime-service | 3001 |
| matching-service | 3002 |
| web-company | 4200 |
| web-admin | 4300 |
| web-landing (shell) | 4400 |
| web-courier | 4401 |
