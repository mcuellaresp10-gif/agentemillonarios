# Snapshot de scouting (base híbrida + SQLite)

Catálogo de equipos y estadísticas para **Scouting**, **Colombianos en el exterior** y **plantilla Millonarios**.

## Arquitectura

```
Runtime:  SQLite (data/scout.db) → fallback JSON estático → fallback API-Football
Backup:   npm run export:scout → public/data/snapshot/ (commitear en git)
```

**Ventana histórica:** jun 2024 – may 2026 (`2024-2025` y `2025-2026`), fusionando varias temporadas API por liga.

**Desde jun 2026:** updates esporádicos por jugador/equipo → SQLite (`source=manual`).

## Comandos

```bash
# Importar JSON existente → SQLite (rápido, one-shot)
npm run migrate:scout

# Sync bulk API → SQLite + export JSON
npm run sync:scout

# Export SQLite → public/data/snapshot/
npm run export:scout

# Updates esporádicos
npm run sync:player -- --search=Marchiori --league=128 --season-key=2025-2026
npm run sync:player -- --id=12345 --team=438 --league=128 --season-key=2025-2026
npm run sync:team -- --team=438 --league=128 --name=Velez --season-key=2025-2026
```

## Mapeo de temporadas (multi-season merge)

| Temporada UI | Ligas europeas / MLS | Ligas sudamericanas / Colombia / MX |
|--------------|----------------------|-------------------------------------|
| 2024-2025 | API `[2024]` | API `[2024, 2025]` |
| 2025-2026 | API `[2025]` | API `[2025, 2026]` |

Liga MX (`262`): override `2025-2026` → API `2025`.

El sync usa **plantilla completa** (`players/squads`) + fetch por jugador/temporada para evitar truncar plantillas (ej. arqueros como Marchiori en Vélez).

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `SCOUT_DB_PATH` | `data/scout.db` | Ruta SQLite en servidor |
| `SCOUT_WRITE_ENABLED` | `false` | POST `/api/scout/fetch-*` en producción |
| `SYNC_DELAY_MS` | `80` | Pausa entre requests en sync |
| `VITE_SCOUT_API` | `/api/scout` | API de lectura scout en cliente |
| `VITE_FORCE_LIVE_API` | `false` | Ignora BD local |

## API REST (servidor)

| Método | Ruta |
|--------|------|
| GET | `/api/scout/teams?leagueIds=&seasonKey=` |
| GET | `/api/scout/players?teamId=&leagueId=&seasonKey=` |
| GET | `/api/scout/player/:id?teamId=&leagueId=&seasonKey=` |
| POST | `/api/scout/fetch-player` |
| POST | `/api/scout/fetch-team` |

## UI

- **Scouting:** selector de temporada + fecha del snapshot.
- **Detalle candidato:** botón **Actualizar stats** (fetch API → SQLite).
- Links incluyen `seasonKey`, `league`, `leagueLabel`.

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `server/db/scoutDb.ts` | SQLite schema y queries |
| `server/services/scoutSyncCore.ts` | Lógica sync bulk/esporádico |
| `server/routes/scoutDb.ts` | API REST |
| `src/services/scoutApi.ts` | Cliente HTTP scout |
| `src/services/scoutCatalogResolver.ts` | SQLite → JSON → API |
