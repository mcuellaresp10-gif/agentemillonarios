# Snapshot de scouting (base híbrida)

Catálogo estático de equipos y estadísticas de jugadores para **Scouting**, **Colombianos en el exterior** y **plantilla Millonarios**, sin gastar cuota de API-Football en cada visita.

## Estructura

```
public/data/snapshot/
  manifest.json              # índice (ligas, rutas, conteos)
  leagues/{leagueId}-{seasonKey}.json
  millonarios/{seasonKey}.json
```

- **Temporadas lógicas:** `2024-2025` y `2025-2026`
- **22 ligas únicas** (SCOUT_LEAGUES + COLOMBIANOS_EXTERIOR, deduplicadas)
- **Plantilla Millonarios** en archivos aparte por temporada

## Generar / actualizar datos

Requiere `API_FOOTBALL_KEY` en `.env` o `.env.local`.

```bash
# Sync incremental (omite archivos ya existentes)
npm run sync:scout

# Regenerar todo
npm run sync:scout -- --force
```

Variables opcionales:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `SYNC_DELAY_MS` | `80` | Pausa entre requests a API-Football |
| `API_FOOTBALL_BASE_URL` | api-sports v3 | Base URL de la API |

Tras un sync exitoso, **commitea** `public/data/snapshot/` para que Render/Netlify sirvan los JSON en producción.

Estimación: ~2.000 requests por corrida completa (muy por debajo del límite diario).

## Mapeo de temporadas

| Temporada (UI) | Ligas sudamericanas / Colombia / Liga MX | Ligas europeas / MLS / KSA / Turquía |
|----------------|------------------------------------------|--------------------------------------|
| 2024-2025 | API `season=2025` | API `season=2024` |
| 2025-2026 | API `season=2026` | API `season=2025` |

Definido en [`src/config/scoutSnapshotSeasons.ts`](../src/config/scoutSnapshotSeasons.ts).

**Excepciones:** Liga MX (`262`) usa `season=2025` para la temporada lógica `2025-2026` hasta que API-Football publique la season 2026.

## Runtime en la app

1. [`snapshotStore.ts`](../src/services/snapshotStore.ts) carga `manifest.json` y hace lazy-load de archivos de liga.
2. [`scoutCatalogResolver.ts`](../src/services/scoutCatalogResolver.ts) devuelve snapshot si existe; si no, llama a la API (fallback).
3. Hooks [`useScouting`](../src/hooks/useScouting.ts) y [`useMillonariosPlayers`](../src/hooks/useJugadores.ts) usan los resolvers.

### Variables de entorno (cliente)

| Variable | Descripción |
|----------|-------------|
| `VITE_FORCE_LIVE_API=true` | Ignora snapshot; siempre API en vivo |
| `VITE_SNAPSHOT_URL` | Base URL (default `/data/snapshot`) |

## UI

En **Scouting** hay selector de temporada (`2024/2025` | `2025/2026`) y la fecha del último sync (`manifest.generatedAt`).

Lo que **sigue en API en vivo:** fixtures, tablas, H2H, alineaciones, Transfermarkt, análisis IA.

## Archivos clave

| Archivo | Rol |
|---------|-----|
| `scripts/sync-scout-snapshot.ts` | Generador desde API-Football |
| `src/types/scoutSnapshot.ts` | Tipos del manifest y snapshots |
| `src/services/snapshotStore.ts` | Lectura en cliente |
| `src/services/scoutCatalogResolver.ts` | Snapshot o fallback API |
