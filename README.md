# Millonarios Analytics

Aplicación web de **análisis táctico** y **scouting** para Millonarios FC. Datos en vivo desde [API-Football](https://www.api-football.com/) con caché agresivo (4 h) y análisis generados con **OpenRouter** (Claude/Gemini).

## Requisitos

- Node.js 20+
- Clave [API-Football](https://dashboard.api-football.com/)
- Clave [OpenRouter](https://openrouter.ai/keys) (análisis IA; formato `sk-or-v1-...`)

## Configuración

1. Copia `.env.example` a `.env` y completa las variables (nunca subas `.env` a git):

```env
API_FOOTBALL_KEY=tu_clave
OPENROUTER_API_KEY=sk-or-v1-tu_clave
```

2. Instala dependencias:

```bash
npm install
```

3. Arranca API proxy + frontend:

```bash
npm run dev
```

- Web: http://localhost:5173  
- API proxy: http://localhost:3001  

## Producción

```bash
npm run build
NODE_ENV=production npm run start:prod
```

O en un solo paso: `npm run preview` (build + servidor en http://localhost:3001).

Variables importantes en el hosting:

| Variable | Uso |
|----------|-----|
| `APP_URL` | URL pública de la app (CORS en producción) |
| `API_FOOTBALL_KEY` | Proxy de datos |
| `OPENROUTER_API_KEY` | Análisis IA |
| `API_FOOTBALL_DAILY_LIMIT` | Tope diario de requests salientes (default 80) |
| `REQUIRE_ACCESS_CODE` | `true` para pedir código compartido (sin cuentas) |
| `APP_ACCESS_SECRET` | Código que compartes con testers |

## Despliegue seguro (sin login)

La app incluye protecciones en el servidor Express:

- **CORS** restringido a `APP_URL` en producción
- **Rate limits** por IP en `/api/*`, IA (5/h), mercado (30/h), fútbol (60/15 min)
- **Proxy API-Football** solo con rutas usadas por la app (`/fixtures`, `/players`, `/teams`, etc.)
- **Cuota diaria** de API-Football en servidor + caché 4 h
- **Código de acceso** opcional (`REQUIRE_ACCESS_CODE=true`): cookie httpOnly, pantalla de entrada
- `robots.txt` y `noindex` para no indexar en beta

Recomendado en internet: HTTPS del hosting, variables solo en el panel, y opcionalmente **Cloudflare** delante para filtrar bots.

## GitHub y Netlify

Guía paso a paso: **[DEPLOY.md](DEPLOY.md)**.

- **GitHub:** código fuente (sin `.env`).
- **Netlify:** frontend (`npm run build:netlify` → `dist/`).
- **Render:** API Express (`npm run start:api` + `API_ONLY=true`).

Netlify reenvía `/api/*` al backend en Render; en Render configura `APP_URL` con la URL de Netlify.

## Límites API

Plan Starter: **100 requests/día**. La app:

- Cachea respuestas 4 h en `localStorage`
- Carga plantillas de scouting **por equipo** bajo demanda
- Evita refetch al cambiar de pestaña
- Valor de mercado (Transfermarkt) solo para top candidatos / detalle; requiere `APIFY_TOKEN` opcional
- Fichas de traspaso vía `/transfers` de API-Football (referencial, no valor actual)

## Secciones

| Ruta | Descripción |
|------|-------------|
| `/` | Dashboard: próximo partido, últimos 5, temporada |
| `/calendario` | Partidos por competición |
| `/analisis` | Análisis previo/post con IA |
| `/h2h` | Head to head vs rivales |
| `/estadisticas` | Plantilla Millonarios |
| `/scouting` | Refuerzos multi-liga · valor TM y fichas de traspaso |
| `/tabla` | Posiciones Liga / copas |
| `/buscar` | Búsqueda global |

## Stack

React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, Zustand, Recharts, Express (proxy).

## Identidad visual

Azul `#1E3A8A`, oro `#FCD116`, solo modo claro.
